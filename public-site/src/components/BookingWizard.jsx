import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, extractData, getVisitorToken } from '../api/index.js'
import QRTicket from './QRTicket.jsx'

const categoryMeta = [
  { key: 'adult', label: 'Adult', desc: 'Above 12 years', fallback: 200 },
  { key: 'child', label: 'Child', desc: '5 to 12 years', fallback: 50 },
  { key: 'student', label: 'Student', desc: 'Valid ID required', fallback: 100 },
  { key: 'senior_citizen', label: 'Senior Citizen', desc: 'Above 60 years', fallback: 80 },
  { key: 'family', label: 'Family Pack', desc: '2 adults + 2 children', fallback: 400 },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function money(n) {
  return `₹${Number(n || 0).toFixed(2)}`
}

function calcTotals(qty, pricing) {
  let total = 0
  const lines = categoryMeta
    .filter((c) => (qty[c.key] || 0) > 0)
    .map((c) => {
      const p = pricing?.[c.key]
      const base = Number(p?.base_price ?? c.fallback)
      const discountPct = Number(p?.discount_pct ?? 0)
      const discountAmount = Math.round(base * (discountPct / 100) * 100) / 100
      const final = Math.max(0, Math.round((base - discountAmount) * 100) / 100)
      const count = Number(qty[c.key] || 0)
      const lineTotal = final * count
      total += lineTotal
      return { ...c, base, discountPct, discountAmount, final, count, lineTotal }
    })
  return { lines, total: Math.round(total * 100) / 100 }
}

export default function BookingWizard() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState([])

  const [locationId, setLocationId] = useState('')
  const [visitDate, setVisitDate] = useState(todayISO())
  const [availability, setAvailability] = useState(null)
  const [pricing, setPricing] = useState({})

  const [qty, setQty] = useState({
    adult: 1,
    child: 0,
    student: 0,
    senior_citizen: 0,
    family: 0,
  })

  const [visitor, setVisitor] = useState({
    name: '',
    phone_no: '',
    email: '',
    id_proof_type: 'aadhaar',
    id_proof_no: '',
    date_of_birth: '',
    gender: 'male',
  })

  const [paymentMode, setPaymentMode] = useState('upi')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const selectedLocation = useMemo(
    () => locations.find((l) => String(l.location_id) === String(locationId)) || null,
    [locations, locationId]
  )

  const totals = useMemo(() => calcTotals(qty, pricing), [qty, pricing])
  const totalTickets = useMemo(() => totals.lines.reduce((s, l) => s + l.count, 0), [totals.lines])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const d = await api.get('/public/locations')
        const data = extractData(d) || []
        if (!alive) return
        setLocations(Array.isArray(data) ? data : [])
        if (data?.[0]?.location_id) setLocationId(String(data[0].location_id))
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load locations')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!locationId || !visitDate) return
    let alive = true

    const fetchAvailability = async () => {
      try {
        const d = await api.get('/public/tickets/available', { params: { location_id: locationId, visit_date: visitDate } })
        const data = extractData(d)
        if (!alive) return
        setAvailability(data)
        setPricing(data?.pricing || selectedLocation?.pricing || {})
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load availability')
      }
    }

    fetchAvailability()
    // Poll for real-time updates every 30 seconds
    const interval = setInterval(fetchAvailability, 30000)

    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [locationId, visitDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const prev = () => setStep((s) => Math.max(1, s - 1))

  const canGoToStep2 = Boolean(locationId && visitDate && (availability?.remaining ?? 0) > 0)
  const canGoToStep3 = totalTickets > 0 && totalTickets <= (availability?.remaining ?? 0)

  const validateVisitor = () => {
    if (!visitor.name.trim()) return 'Name is required'
    if (!visitor.phone_no.trim()) return 'Phone number is required'
    if (!visitor.email.trim() || !visitor.email.includes('@')) return 'Valid email is required'
    if (!visitor.id_proof_no.trim()) return 'ID proof number is required'
    return ''
  }

  const onPay = async () => {
    const vErr = validateVisitor()
    if (vErr) {
      setError(vErr)
      setStep(3)
      return
    }
    if (!canGoToStep3) {
      setError('Please select valid ticket quantities within remaining capacity.')
      setStep(2)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const payload = {
        location_id: Number(locationId),
        visit_date: visitDate,
        payment_mode: paymentMode,
        tickets: totals.lines.map((l) => ({ category: l.key, quantity: l.count })),
        visitor: {
          ...visitor,
          date_of_birth: visitor.date_of_birth || null,
        },
      }

      const headers = {}
      const token = getVisitorToken()
      if (token) headers.Authorization = `Bearer ${token}`

      const d = await api.post('/public/book', payload, { headers })
      if (d?.data?.success === false) {
        setError(d?.data?.message || 'Payment failed. Please try again.')
        setStep(4)
        return
      }
      const data = extractData(d)
      setResult(data)
    } catch (e) {
      setError(e?.response?.data?.message || 'Booking failed. Please try again.')
      setStep(4)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
      {/* Header with Progress */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-nature-800 via-nature-700 to-nature-800 opacity-95" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center mix-blend-overlay opacity-20" />

        <div className="relative p-5 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold tracking-wide mb-3">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Instant Booking
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">Plan your visit</div>
              <div className="mt-1 text-sm text-white/80">
                Quick, secure, and gate-ready with QR tickets. Guest checkout is supported.
              </div>
            </div>
            <div className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 px-4 py-3 text-right">
              <div className="text-xs text-white/80">Total Amount</div>
              <div className="text-xl font-black text-white">{money(totals.total)}</div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-300 bg-red-500/20 backdrop-blur-sm px-4 py-3 text-sm text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
              {error}
            </div>
          ) : null}

          {/* Step Progress Indicator */}
          <div className="mt-6 relative">
            {/* Progress line */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-white/20 hidden lg:block">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>

            <div className="relative grid grid-cols-4 gap-2 hidden lg:grid">
              {[
                { n: 1, label: 'Location', icon: '📍' },
                { n: 2, label: 'Tickets', icon: '🎫' },
                { n: 3, label: 'Details', icon: '📝' },
                { n: 4, label: 'Generate QR', icon: '📲' },
              ].map((s) => {
                const isCompleted = step > s.n
                const isCurrent = step === s.n
                return (
                  <div key={s.n} className="flex flex-col items-center">
                    <div
                      className={[
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 shadow-lg',
                        isCompleted ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 scale-100' :
                        isCurrent ? 'bg-white text-nature-800 scale-110 ring-4 ring-white/30' :
                        'bg-white/20 text-white/60 scale-90',
                      ].join(' ')}
                    >
                      {isCompleted ? '✓' : s.icon}
                    </div>
                    <div className={`mt-2 text-xs font-semibold transition-colors ${
                      isCurrent ? 'text-white' : 'text-white/60'
                    }`}>
                      {s.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        {loading ? (
          <div className="grid gap-4">
            <div className="skeleton h-12" />
            <div className="skeleton h-40" />
          </div>
        ) : null}

        {!loading && step === 1 ? (
          <div className="grid gap-6">
            <div>
              <div className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📍</span> Select Location & Date
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-nature-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Choose Location
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-medium transition-all hover:border-nature-300 focus:border-nature-800 focus:ring-4 focus:ring-nature-800/10"
                  >
                    {locations.map((l) => (
                      <option key={l.location_id} value={l.location_id}>
                        {l.location_name} — {l.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="group">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-nature-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Visit Date
                  </label>
                  <input
                    type="date"
                    min={todayISO()}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-sm font-medium transition-all hover:border-nature-300 focus:border-nature-800 focus:ring-4 focus:ring-nature-800/10"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-900">Real-time Availability</div>
                    <div className="text-sm text-emerald-700">
                      Slots are updated live • Booking closes at 4:00 PM
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-emerald-600 font-semibold">Remaining Today</div>
                    <div className="text-2xl font-black text-emerald-900">{availability ? availability.remaining : '—'}</div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-emerald-300 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                disabled={!canGoToStep2}
                onClick={() => {
                  setError('')
                  setStep(2)
                }}
                className={[
                  'rounded-2xl px-8 py-4 text-sm font-bold transition-all flex items-center gap-2',
                  canGoToStep2
                    ? 'bg-gradient-to-r from-nature-800 to-nature-700 text-white hover:shadow-lg hover:shadow-nature-800/25 hover:scale-105'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                ].join(' ')}
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        ) : null}

        {!loading && step === 2 ? (
          <div className="grid gap-6">
            <div>
              <div className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎫</span> Select Tickets
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                  Prices update instantly when admin changes pricing. Live availability shown below.
                </div>
              </div>

              <div className="grid gap-3">
                {categoryMeta.map((c) => {
                  const p = pricing?.[c.key]
                  const base = Number(p?.base_price ?? c.fallback)
                  const discountPct = Number(p?.discount_pct ?? 0)
                  const discountAmount = Math.round(base * (discountPct / 100) * 100) / 100
                  const final = Math.max(0, Math.round((base - discountAmount) * 100) / 100)
                  const isSelected = (qty[c.key] || 0) > 0
                  return (
                    <div
                      key={c.key}
                      className={[
                        'flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 p-4 transition-all duration-300',
                        isSelected
                          ? 'border-nature-800 bg-nature-50 shadow-lg shadow-nature-800/5'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      ].join(' ')}
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-slate-900">{c.label}</div>
                          {discountPct > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>
                        {c.desc && <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>}
                        <div className="mt-1 flex items-center gap-2">
                          {discountPct > 0 ? (
                            <>
                              <span className="text-sm text-slate-400 line-through">{money(base)}</span>
                              <span className="text-lg font-black text-nature-800">{money(final)}</span>
                            </>
                          ) : (
                            <span className="text-lg font-black text-slate-800">{money(base)}</span>
                          )}
                          <span className="text-xs text-slate-400">/ ticket</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setQty((q) => ({ ...q, [c.key]: Math.max(0, Number(q[c.key] || 0) - 1) }))}
                          className="h-11 w-11 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-lg hover:border-nature-800 hover:bg-nature-800 hover:text-white transition-all active:scale-95"
                        >
                          −
                        </button>
                        <div className={[
                          'h-11 w-16 rounded-2xl border-2 flex items-center justify-center text-lg font-black transition-all',
                          isSelected ? 'border-nature-800 bg-nature-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-900',
                        ].join(' ')}>
                          {qty[c.key] || 0}
                        </div>
                        <button
                          onClick={() => setQty((q) => ({ ...q, [c.key]: Number(q[c.key] || 0) + 1 }))}
                          className="h-11 w-11 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 font-bold text-lg hover:border-nature-800 hover:bg-nature-800 hover:text-white transition-all active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Summary Card */}
            <div className="rounded-3xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-nature-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">
                      Selected: <span className="font-bold text-nature-800">{totalTickets}</span> tickets
                    </div>
                    <div className="text-sm text-slate-500">
                      Available: <span className="font-semibold">{availability?.remaining ?? '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-semibold">Total Amount</div>
                  <div className="text-2xl font-black text-nature-800">{money(totals.total)}</div>
                </div>
              </div>
              {totalTickets > (availability?.remaining ?? 0) ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                  Selected quantity exceeds available tickets. Please reduce quantities.
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                onClick={prev}
                className="rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                Back
              </button>
              <button
                disabled={!canGoToStep3}
                onClick={() => {
                  setError('')
                  setStep(3)
                }}
                className={[
                  'rounded-2xl px-8 py-4 text-sm font-bold transition-all flex items-center gap-2',
                  canGoToStep3
                    ? 'bg-gradient-to-r from-nature-800 to-nature-700 text-white hover:shadow-lg hover:shadow-nature-800/25 hover:scale-105'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                ].join(' ')}
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        ) : null}

        {!loading && step === 3 ? (
          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Visitor details</div>
              <div className="mt-1 text-sm text-slate-600">These details are used to generate your ticket records and validate entry.</div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-800">Full name</label>
                  <input
                    value={visitor.name}
                    onChange={(e) => setVisitor((v) => ({ ...v, name: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    placeholder="e.g., Arjun Krishnan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Phone</label>
                  <input
                    value={visitor.phone_no}
                    onChange={(e) => setVisitor((v) => ({ ...v, phone_no: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    placeholder="e.g., 9876543210"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Email</label>
                  <input
                    value={visitor.email}
                    onChange={(e) => setVisitor((v) => ({ ...v, email: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Date of birth</label>
                  <input
                    type="date"
                    value={visitor.date_of_birth}
                    onChange={(e) => setVisitor((v) => ({ ...v, date_of_birth: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">Gender</label>
                  <select
                    value={visitor.gender}
                    onChange={(e) => setVisitor((v) => ({ ...v, gender: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-800">ID proof type</label>
                  <select
                    value={visitor.id_proof_type}
                    onChange={(e) => setVisitor((v) => ({ ...v, id_proof_type: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                  >
                    <option value="aadhaar">Aadhaar</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="pan_card">PAN Card</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-slate-800">ID proof number</label>
                  <input
                    value={visitor.id_proof_no}
                    onChange={(e) => setVisitor((v) => ({ ...v, id_proof_no: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    placeholder="Enter your ID proof number"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button onClick={prev} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Back
              </button>
              <button
                onClick={() => {
                  const vErr = validateVisitor()
                  if (vErr) setError(vErr)
                  else {
                    setError('')
                    setStep(4)
                  }
                }}
                className="rounded-2xl bg-nature-800 px-5 py-3 text-sm font-semibold text-white hover:bg-nature-700"
              >
                Continue to payment
              </button>
            </div>
          </div>
        ) : null}

        {!loading && step === 4 ? (
          <div className="grid gap-5">
            {/* ── After QR generated ── */}
            {result ? (
              <>
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-900">Booking confirmed!</div>
                    <div className="text-xs text-emerald-700 mt-0.5">Txn: <span className="font-mono">{result.transaction_id}</span></div>
                  </div>
                </div>

                <QRTicket
                  value={result?.transaction_id || (result?.tickets?.[0]?.ticket_qr ?? 'VMS-BOOKING')}
                  title={`${result?.tickets?.[0]?.location_name ?? selectedLocation?.location_name} • ${totalTickets} ticket${totalTickets !== 1 ? 's' : ''}`}
                  subtitle={`Valid: ${visitDate} • Txn: ${result.transaction_id}`}
                  filename={`vms-booking-${result?.payment_id || 'ticket'}.png`}
                />

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => { setResult(null); setStep(1) }}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Book another visit
                  </button>
                  <Link
                    to="/my-tickets"
                    className="rounded-2xl bg-nature-800 px-5 py-3 text-sm font-semibold text-white hover:bg-nature-700"
                  >
                    Go to My Tickets
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Order summary card */}
                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Order Summary</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg">{selectedLocation?.location_name}</div>
                        <div className="text-slate-400 text-sm mt-0.5">{visitDate} &nbsp;•&nbsp; {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Amount</div>
                        <div className="text-3xl font-black text-green-400">{money(totals.total)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 divide-y divide-slate-100">
                    {totals.lines.map((l) => (
                      <div key={l.key} className="flex items-center justify-between py-3">
                        <div>
                          <span className="text-sm font-semibold text-slate-800">{l.label}</span>
                          <span className="text-slate-400 text-sm"> × {l.count}</span>
                          {l.discountPct > 0 && (
                            <span className="ml-2 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              {l.discountPct}% off
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-slate-900">{money(l.lineTotal)}</div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3">
                      <div className="text-sm font-bold text-slate-900">Total</div>
                      <div className="text-lg font-black text-slate-900">{money(totals.total)}</div>
                    </div>
                  </div>
                </div>

                {/* Visitor summary */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Booking for</div>
                  <div className="font-semibold text-slate-900">{visitor.name}</div>
                  <div className="text-slate-500 mt-0.5">{visitor.email} &nbsp;•&nbsp; {visitor.phone_no}</div>
                </div>

                {/* Notice */}
                <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-xs text-amber-800 leading-relaxed">
                  Online Tickets once booked <strong>cannot be Cancelled / Refunded</strong>, but can be rescheduled from your profile.
                  Ticket booking closes at <strong>4:00 PM</strong>.
                </div>

                {/* Payment placeholder */}
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">💳</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Payment Gateway</div>
                    <div className="text-xs text-slate-500 mt-0.5">Payment integration will be added soon. Click below to generate your QR.</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={prev}
                    className="rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    Back
                  </button>
                  <button
                    disabled={submitting}
                    onClick={onPay}
                    className={[
                      'flex-1 rounded-2xl px-6 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2',
                      submitting
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25 hover:scale-[1.02]',
                    ].join(' ')}
                  >
                    {submitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Generating QR…
                      </>
                    ) : 'Generate QR'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}


