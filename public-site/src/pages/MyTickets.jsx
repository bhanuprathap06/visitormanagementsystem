import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, extractData, getVisitorToken, setVisitorToken } from '../api/index.js'
import QRTicket from '../components/QRTicket.jsx'

const tabs = [
  { id: 'tickets', label: 'Ticket Bookings', icon: '🎫' },
  { id: 'profile', label: 'My Profile', icon: '👤' },
  { id: 'queries', label: 'My Queries', icon: '💬' },
]

const queryTypes = [
  { value: 'refund', label: 'Refund' },
  { value: 'reschedule', label: 'Reschedule Issue' },
  { value: 'lost_ticket', label: 'Lost Ticket' },
  { value: 'general', label: 'General Enquiry' },
  { value: 'other', label: 'Other' },
]

function statusBadge(status) {
  const map = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    used: 'bg-gray-100 text-gray-700 border-gray-200',
    expired: 'bg-amber-100 text-amber-800 border-amber-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

function queryStatusBadge(status) {
  const map = {
    open: 'bg-blue-100 text-blue-800',
    in_review: 'bg-amber-100 text-amber-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-gray-100 text-gray-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

export default function MyTickets() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [profile, setProfile] = useState(null)
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState({ tickets: true, profile: false, queries: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: '', phone_no: '', gender: '', date_of_birth: '', address: '', city: '', state: '', pincode: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Query form
  const [queryForm, setQueryForm] = useState({ query_type: 'general', ticket_id: '', issue: '' })
  const [submittingQuery, setSubmittingQuery] = useState(false)

  const authed = Boolean(getVisitorToken())

  const fetchTickets = useCallback(async () => {
    setLoading(l => ({ ...l, tickets: true }))
    try {
      const d = await api.get('/public/my-tickets')
      setTickets(Array.isArray(extractData(d)) ? extractData(d) : [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load tickets')
    } finally {
      setLoading(l => ({ ...l, tickets: false }))
    }
  }, [])

  const fetchProfile = useCallback(async () => {
    setLoading(l => ({ ...l, profile: true }))
    try {
      const d = await api.get('/public/profile')
      const data = extractData(d)
      setProfile(data)
      if (data?.visitor) {
        setProfileForm({
          name: data.visitor.name || '',
          phone_no: data.visitor.phone_no || '',
          gender: data.visitor.gender || '',
          date_of_birth: data.visitor.date_of_birth ? String(data.visitor.date_of_birth).slice(0, 10) : '',
          address: data.visitor.address || '',
          city: data.visitor.city || '',
          state: data.visitor.state || '',
          pincode: data.visitor.pincode || '',
        })
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load profile')
    } finally {
      setLoading(l => ({ ...l, profile: false }))
    }
  }, [])

  const fetchQueries = useCallback(async () => {
    setLoading(l => ({ ...l, queries: true }))
    try {
      const d = await api.get('/public/my-queries')
      setQueries(Array.isArray(extractData(d)) ? extractData(d) : [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load queries')
    } finally {
      setLoading(l => ({ ...l, queries: false }))
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchTickets()
    fetchProfile()
  }, [authed, fetchTickets, fetchProfile])

  useEffect(() => {
    if (!authed || activeTab !== 'queries') return
    fetchQueries()
  }, [authed, activeTab, fetchQueries])

  const handleLogout = () => {
    setVisitorToken(null)
    navigate('/login')
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSavingProfile(true)
    try {
      await api.put('/public/profile', profileForm)
      setSuccess('Profile updated successfully!')
      await fetchProfile()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleQuerySubmit = async (e) => {
    e.preventDefault()
    if (!queryForm.issue.trim()) return setError('Please describe your issue')
    setError('')
    setSuccess('')
    setSubmittingQuery(true)
    try {
      const payload = {
        query_type: queryForm.query_type,
        issue: queryForm.issue,
        ticket_id: queryForm.ticket_id ? Number(queryForm.ticket_id) : undefined,
      }
      await api.post('/public/my-queries', payload)
      setSuccess('Query submitted successfully! We\'ll respond within 24 hours.')
      setQueryForm({ query_type: 'general', ticket_id: '', issue: '' })
      await fetchQueries()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit query')
    } finally {
      setSubmittingQuery(false)
    }
  }

  if (!authed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🎫</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Login Required</h2>
          <p className="text-gray-500 mb-8">Please log in to view your booking history and manage your account.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition">
              Login
            </Link>
            <Link to="/tickets" className="border border-gray-200 bg-white text-gray-700 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition">
              Book as guest
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const emailDisplay = profile?.email || '...'
  const nameDisplay = profile?.visitor?.name || emailDisplay.split('@')[0]
  const initials = nameDisplay.charAt(0).toUpperCase()

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900 via-emerald-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black">
                {initials}
              </div>
              <div>
                <div className="text-sm text-green-300 font-medium">Welcome back,</div>
                <div className="text-xl font-black">{nameDisplay}</div>
                <div className="text-sm text-white/60">{emailDisplay}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition"
            >
              <span>↪</span> Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess('') }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-green-800 shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-800 flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 text-sm text-emerald-800 flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        {/* ── TICKETS TAB ─────────────────────────────────────────── */}
        {activeTab === 'tickets' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Ticket Booking Details</h2>
                <div className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full inline-block mt-2">
                  Online Tickets once booked cannot be Cancelled / Refunded, but can be rescheduled.
                </div>
              </div>
              <Link to="/tickets" className="bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-green-700 transition">
                + Book More
              </Link>
            </div>

            {loading.tickets ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {[1, 2].map(i => <div key={i} className="h-72 rounded-3xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-lg font-bold text-gray-900">No tickets yet</h3>
                <p className="text-gray-500 mt-2 mb-6">Book your first visit and your QR tickets will appear here.</p>
                <Link to="/tickets" className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-700 transition">
                  Book Tickets
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {tickets.map((t) => (
                  <div key={t.ticket_id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                    {/* Ticket header */}
                    <div className="bg-gradient-to-r from-green-700 to-emerald-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">{t.location_name}</div>
                          <div className="text-xs text-green-200 mt-0.5">{t.ticket_category} ticket</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(t.ticket_status)} bg-white`}>
                          {t.ticket_status}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                        <div className="bg-gray-50 rounded-2xl p-3">
                          <div className="text-xs text-gray-500">Valid Date</div>
                          <div className="text-sm font-bold text-gray-900">{String(t.valid_from).slice(0, 10)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3">
                          <div className="text-xs text-gray-500">Amount</div>
                          <div className="text-sm font-bold text-green-700">₹{Number(t.final_price || 0).toFixed(2)}</div>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3">
                          <div className="text-xs text-gray-500">Payment</div>
                          <div className="text-sm font-bold text-gray-900">{t.payment_mode?.toUpperCase() || '—'}</div>
                        </div>
                      </div>
                      <QRTicket
                        value={t.ticket_qr}
                        title={`Gate QR — Ticket #${t.ticket_id}`}
                        subtitle={`${t.location_name} • ${String(t.valid_from).slice(0, 10)}`}
                        filename={`vms-ticket-${t.ticket_id}.png`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Profile Update</h2>

            {loading.profile ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : (
              <form onSubmit={handleProfileSave} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                {!profile?.visitor && (
                  <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    Complete a booking first — your profile will be auto-created when you book your first ticket.
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Email</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Mobile Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone_no}
                      onChange={e => setProfileForm(f => ({ ...f, phone_no: e.target.value }))}
                      placeholder="+91 xxxxx xxxxx"
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={e => setProfileForm(f => ({ ...f, date_of_birth: e.target.value }))}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Street address"
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="City"
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">State</label>
                    <select
                      value={profileForm.state}
                      onChange={e => setProfileForm(f => ({ ...f, state: e.target.value }))}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                    >
                      <option value="">Select State</option>
                      {['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Pincode</label>
                    <input
                      type="text"
                      value={profileForm.pincode}
                      onChange={e => setProfileForm(f => ({ ...f, pincode: e.target.value }))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={savingProfile || !profile?.visitor}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-8 py-3 rounded-full text-sm transition"
                  >
                    {savingProfile ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── QUERIES TAB ─────────────────────────────────────────── */}
        {activeTab === 'queries' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Submit Your Query</h2>

            {/* Query form */}
            <form onSubmit={handleQuerySubmit} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm mb-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Query Type *</label>
                  <select
                    required
                    value={queryForm.query_type}
                    onChange={e => setQueryForm(f => ({ ...f, query_type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                  >
                    {queryTypes.map(qt => <option key={qt.value} value={qt.value}>{qt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Related Ticket (optional)</label>
                  <select
                    value={queryForm.ticket_id}
                    onChange={e => setQueryForm(f => ({ ...f, ticket_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 outline-none bg-gray-50 focus:bg-white transition"
                  >
                    <option value="">Select Ticket</option>
                    {tickets.map(t => (
                      <option key={t.ticket_id} value={t.ticket_id}>
                        #{t.ticket_id} — {t.location_name} ({String(t.valid_from).slice(0, 10)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Describe Your Issue *</label>
                  <textarea
                    required
                    value={queryForm.issue}
                    onChange={e => setQueryForm(f => ({ ...f, issue: e.target.value }))}
                    rows={4}
                    placeholder="Please describe your issue in detail..."
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none bg-gray-50 focus:bg-white transition resize-none"
                  />
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="submit"
                  disabled={submittingQuery}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold px-8 py-3 rounded-full text-sm transition"
                >
                  {submittingQuery ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>

            {/* Queries list */}
            <h3 className="text-lg font-bold text-gray-900 mb-4">My Queries</h3>
            {loading.queries ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-200 animate-pulse" />)}
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500 text-sm">No queries submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queries.map((q, idx) => (
                  <div key={q.query_id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                          <span className="text-sm font-bold text-gray-900 capitalize">{q.query_type?.replace('_', ' ')}</span>
                          {q.ticket_qr && (
                            <span className="text-xs text-gray-400">• {q.ticket_category} — {String(q.valid_from).slice(0, 10)}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{q.issue}</p>
                        {q.remarks && (
                          <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <span className="font-bold">Admin reply:</span> {q.remarks}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${queryStatusBadge(q.status)}`}>
                          {q.status?.replace('_', ' ')}
                        </span>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
