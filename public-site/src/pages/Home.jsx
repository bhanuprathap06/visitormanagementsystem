import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { api, extractData } from '../api/index.js'
import LocationCard from '../components/LocationCard.jsx'

const locationTypes = [
  { type: 'zoo', label: 'Wildlife Parks', emoji: '🦁', gradient: 'from-emerald-600 to-teal-700' },
  { type: 'museum', label: 'Museums', emoji: '🏛️', gradient: 'from-amber-600 to-orange-700' },
  { type: 'botanical_garden', label: 'Botanical Gardens', emoji: '🌿', gradient: 'from-lime-600 to-green-700' },
  { type: 'aquarium', label: 'Aquariums', emoji: '🐠', gradient: 'from-blue-600 to-cyan-700' },
]

const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1534567059665-cb530f259f6b?auto=format&fit=crop&q=80&w=2400',
    label: 'Wildlife Parks',
    title: 'Into the Wild',
    sub: 'Face to face with nature\'s most magnificent creatures',
    accent: 'text-emerald-400',
  },
  {
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=2400',
    label: 'Aquariums',
    title: 'Beneath the Waves',
    sub: 'Dive into the ocean\'s most dazzling wonders',
    accent: 'text-cyan-400',
  },
  {
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=2400',
    label: 'Botanical Gardens',
    title: 'Nature in Bloom',
    sub: 'Find peace among thousands of rare and exotic plants',
    accent: 'text-lime-400',
  },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState([])
  const [events, setEvents] = useState([])
  const [activeType, setActiveType] = useState('all')
  const [heroIdx, setHeroIdx] = useState(0)

  // Search bar state
  const [searchDate, setSearchDate] = useState(todayISO())
  const [searchType, setSearchType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Auto-rotate hero
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroSlides.length), 6000)
    return () => clearInterval(t)
  }, [])

  const upcoming = useMemo(() => (Array.isArray(events) ? events : []).slice(0, 3), [events])

  const filteredLocations = useMemo(() => {
    let list = locations
    if (activeType !== 'all') list = list.filter(l => l.location_type === activeType)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(l =>
        l.location_name.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.state?.toLowerCase().includes(q)
      )
    }
    if (searchType) list = list.filter(l => l.location_type === searchType)
    return list
  }, [locations, activeType, searchQuery, searchType])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const [locRes, eventRes] = await Promise.all([
          api.get('/public/locations'),
          api.get('/public/events'),
        ])
        if (!alive) return
        setLocations(extractData(locRes) || [])
        setEvents(extractData(eventRes) || [])
      } catch (e) {
        if (!alive) return
        setError(e?.response?.data?.message || 'Failed to load content')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/tickets`)
  }

  const hero = heroSlides[heroIdx]

  return (
    <div className="bg-white">

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background slides */}
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === heroIdx ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={slide.image} alt={slide.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white" />
          </div>
        ))}

        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto px-4 w-full pt-24 pb-8">
          {/* Slide label */}
          <motion.div
            key={heroIdx + 'label'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-widest uppercase">
              {hero.label}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            key={heroIdx + 'title'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-none mb-4"
          >
            {hero.title}
          </motion.h1>

          <motion.p
            key={heroIdx + 'sub'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg md:text-2xl font-light ${hero.accent} max-w-xl mb-10`}
          >
            {hero.sub}
          </motion.p>

          {/* ─── SEARCH BAR ──────────────────────────────────────── */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-3 flex flex-col md:flex-row gap-2 max-w-4xl"
          >
            {/* Search text */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-2xl border border-gray-100 bg-white">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search parks, museums, cities…"
                className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-gray-100 bg-white min-w-[160px]">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={searchDate}
                min={todayISO()}
                onChange={e => setSearchDate(e.target.value)}
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent"
              />
            </div>

            {/* Type */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-gray-100 bg-white min-w-[150px]">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <select
                value={searchType}
                onChange={e => { setSearchType(e.target.value); setActiveType(e.target.value || 'all') }}
                className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
              >
                <option value="">All types</option>
                {locationTypes.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all hover:shadow-lg hover:shadow-green-500/30 whitespace-nowrap"
            >
              Book Now
            </button>
          </motion.form>

          {/* Hero slide indicators */}
          <div className="flex gap-2 mt-8">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                className={`rounded-full transition-all ${i === heroIdx ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOCATION TYPES ──────────────────────────────────────── */}
      <section className="py-16 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold tracking-widest text-green-400 uppercase">Explore</span>
            <h2 className="mt-2 text-4xl font-black">Choose Your Adventure</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {locationTypes.map(type => {
              const count = locations.filter(l => l.location_type === type.type).length
              return (
                <motion.button
                  key={type.type}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setActiveType(type.type); document.getElementById('locations-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${type.gradient} p-6 text-left shadow-lg hover:shadow-xl transition-shadow`}
                >
                  <div className="text-4xl mb-4">{type.emoji}</div>
                  <div className="text-xl font-black">{type.label}</div>
                  <div className="text-white/70 text-sm mt-1">{count} location{count !== 1 ? 's' : ''}</div>
                  <div className="absolute -bottom-4 -right-4 text-8xl opacity-10">{type.emoji}</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── LOCATIONS GRID ──────────────────────────────────────── */}
      <section id="locations-section" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-semibold tracking-widest text-green-600 uppercase">Live Availability</span>
              <h2 className="mt-1 text-3xl font-black text-gray-900">All Locations</h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setActiveType('all'); setSearchType('') }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeType === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </button>
              {locationTypes.map(t => (
                <button
                  key={t.type}
                  onClick={() => { setActiveType(t.type); setSearchType(t.type) }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeType === t.type ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 rounded-3xl bg-gray-100 animate-pulse" />
              ))
            ) : filteredLocations.length > 0 ? (
              filteredLocations.map(loc => <LocationCard key={loc.location_id} location={loc} />)
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500">No locations found. Try a different filter.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center text-sm">{error}</div>
          )}
        </div>
      </section>

      {/* ─── EVENTS ──────────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-semibold tracking-widest text-green-600 uppercase">What's On</span>
                <h2 className="mt-2 text-3xl font-black text-gray-900">News & Events</h2>
              </div>
              <Link to="/events" className="text-sm font-bold text-green-600 hover:text-green-700">
                View all →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {upcoming.map((e, idx) => {
                const imgs = [
                  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
                  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=800',
                  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800',
                ]
                return (
                  <motion.div
                    key={e.announcement_id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={imgs[idx % imgs.length]}
                        alt={e.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="text-xs text-green-400 font-semibold mb-1">{e.location_name || 'All Locations'}</div>
                        <h3 className="text-lg font-bold text-white line-clamp-2">{e.title}</h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-gray-600 line-clamp-3">{e.message}</p>
                      <div className="mt-3 text-xs text-gray-400">
                        {new Date(e.valid_from).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURES ────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900">Why Book with VMS?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Instant Booking',
                desc: 'Complete your booking in under 2 minutes. No queues, no paperwork — just a few clicks.',
              },
              {
                icon: '📱',
                title: 'QR Gate Entry',
                desc: 'Skip the counter. Your digital QR ticket is scanned directly at the gate for instant entry.',
              },
              {
                icon: '🔴',
                title: 'Live Availability',
                desc: 'Real-time occupancy tracking ensures you always know how many slots remain before you book.',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8 rounded-3xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534567059665-cb530f259f6b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Ready to Explore?
            </h2>
            <p className="text-green-200 text-xl font-light mb-10">
              Join thousands of visitors who book seamlessly with VMS Tours.
            </p>
            <Link
              to="/tickets"
              className="inline-flex items-center gap-3 bg-white text-green-900 font-black text-lg px-10 py-5 rounded-full hover:bg-green-50 transition-all hover:shadow-2xl hover:scale-105"
            >
              Book Your Tickets
              <span className="text-2xl">→</span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
