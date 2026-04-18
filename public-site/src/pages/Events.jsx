import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { api, extractData } from '../api/index.js'

const eventImages = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1499728603963-998042784618?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1504198458649-3128b932f49e?auto=format&fit=crop&q=80&w=800',
]

const heroImages = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2400',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2400',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=2400',
]

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function isoDate(x) {
  const d = new Date(x)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Events() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState([])
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [heroImageIndex] = useState(() => Math.floor(Math.random() * heroImages.length))

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const d = await api.get('/public/events')
        if (!alive) return
        setEvents(extractData(d) || [])
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load events')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const eventsByDay = useMemo(() => {
    const map = {}
    for (const e of events || []) {
      const day = isoDate(e.valid_from)
      if (!day) continue
      map[day] = map[day] || []
      map[day].push(e)
    }
    return map
  }, [events])

  const grid = useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const days = []
    const firstWeekday = start.getDay()
    for (let i = 0; i < firstWeekday; i++) days.push(null)
    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(month.getFullYear(), month.getMonth(), d))
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [month])

  const title = useMemo(() => month.toLocaleString(undefined, { month: 'long', year: 'numeric' }), [month])

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section - Immersive Experience */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImages[heroImageIndex]}
            alt="Events Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-slate-50" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold tracking-wide mb-6"
          >
            What's On at VMS Tours
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight"
          >
            Events & Shows
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light"
          >
            Discover special experiences, seasonal shows, and unforgettable moments waiting for you.
          </motion.p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 -mt-20 relative z-20">
        {/* Calendar Section */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div>
              <span className="text-xs font-semibold tracking-wide text-amber-600 uppercase">Interactive Calendar</span>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth(addMonths(month, -1))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setMonth(startOfMonth(new Date()))}
                className="rounded-2xl bg-nature-800 px-4 py-2 text-sm font-semibold text-white hover:bg-nature-700 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setMonth(addMonths(month, 1))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {error ? (
            <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {weekDays.map((w) => (
            <div key={w} className="px-3 py-3 text-xs font-bold text-slate-700 text-center uppercase tracking-wide">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, idx) => {
            const dayKey = d ? d.toISOString().slice(0, 10) : null
            const dayEvents = dayKey ? eventsByDay[dayKey] || [] : []
            const isToday = dayKey === new Date().toISOString().slice(0, 10)
            return (
              <div
                key={idx}
                className={`min-h-[120px] border-b border-r border-slate-100 p-2 last:border-r-0 transition-colors ${
                  isToday ? 'bg-amber-50' : 'hover:bg-slate-50'
                }`}
              >
                {d ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-bold ${isToday ? 'text-amber-700' : 'text-slate-700'}`}>
                        {d.getDate()}
                      </div>
                      {dayEvents.length ? (
                        <div className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          {dayEvents.length}
                        </div>
                      ) : null}
                    </div>
                    <div className="grid gap-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.announcement_id}
                          className="rounded-md bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-2 py-1.5 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="text-[10px] font-bold text-amber-900 line-clamp-1">{e.title}</div>
                          <div className="text-[9px] text-amber-700 line-clamp-1">{e.location_name || 'All locations'}</div>
                        </div>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className="text-[9px] font-semibold text-amber-600">+ {dayEvents.length - 3} more</div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            )
          })}
        </div>
        </div>

      {/* Events Grid Section */}
      <div className="mt-16 mb-20">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold tracking-wide text-amber-600 uppercase">Discover</span>
          <h3 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">All Upcoming Events</h3>
          <p className="mt-2 text-slate-600 max-w-xl mx-auto">From special shows to seasonal celebrations — find your next memorable experience.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              <div className="skeleton h-64 rounded-3xl" />
              <div className="skeleton h-64 rounded-3xl" />
              <div className="skeleton h-64 rounded-3xl" />
            </>
          ) : (events || []).length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center col-span-full">
              <div className="text-5xl mb-4">📅</div>
              <div className="text-lg font-semibold text-slate-900">No events right now</div>
              <p className="mt-2 text-sm text-slate-600">Check back soon for new announcements and special experiences.</p>
            </div>
          ) : (
            events.map((e, idx) => {
              const eventImage = eventImages[idx % eventImages.length]
              return (
                <motion.div
                  key={e.announcement_id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group rounded-3xl border border-slate-200 bg-white overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={eventImage}
                      alt={e.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className="rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-slate-900 shadow-lg">
                        {new Date(e.valid_from).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                        {e.location_name || 'All Locations'}
                      </div>
                      <h3 className="text-xl font-bold text-white line-clamp-2 drop-shadow-lg">{e.title}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">{e.message}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {new Date(e.valid_from).toLocaleDateString('en-IN', { year: 'numeric' })}
                      </div>
                      <span className="text-sm font-bold text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Learn more <span>→</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
