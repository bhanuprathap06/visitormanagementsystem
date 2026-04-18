import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api, extractData } from '../api/index.js'

const categoryImages = {
  'Big Cats':      'https://images.unsplash.com/photo-1549471156-52c730878ea2?auto=format&fit=crop&q=80&w=800',
  'Herbivores':    'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=800',
  'Birds':         'https://images.unsplash.com/photo-1522748906645-95d8adfa52c1?auto=format&fit=crop&q=80&w=800',
  'Aquatic':       'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800',
  'Primates':      'https://images.unsplash.com/photo-1540205082460-e8f00034a7eb?auto=format&fit=crop&q=80&w=800',
  'Reptiles':      'https://images.unsplash.com/photo-1535074151861-5a67e2953813?auto=format&fit=crop&q=80&w=800',
  'Special Exhibit':'https://images.unsplash.com/photo-1518182170546-0766ce6fec56?auto=format&fit=crop&q=80&w=800',
}

const defaultImage = 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&q=80&w=800'

// Categories that make sense on an "Animals" page
const ANIMAL_CATEGORIES = ['Big Cats', 'Herbivores', 'Aquatic', 'Birds', 'Primates', 'Reptiles', 'Special Exhibit']

const zoneColorMap = {
  'Asia':    'bg-emerald-100 text-emerald-800',
  'Africa':  'bg-amber-100 text-amber-800',
  'Aquarium':'bg-blue-100 text-blue-800',
  'Aviary':  'bg-teal-100 text-teal-800',
}

// Alternate live/scheduled status for display (DB has no live_status)
function isLive(idx) { return idx % 3 !== 2 }

export default function Animals() {
  const [exhibits, setExhibits] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const d = await api.get('/public/exhibits')
        if (!alive) return
        // Keep only animal-relevant categories
        const all = (extractData(d) || []).filter(e =>
          ANIMAL_CATEGORIES.includes(e.category)
        )
        setExhibits(all)
      } catch (_e) {
        // silently fall through — empty state shown
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const categories = useMemo(() => {
    const seen = new Set()
    exhibits.forEach(e => seen.add(e.category))
    return ['All', ...ANIMAL_CATEGORIES.filter(c => seen.has(c))]
  }, [exhibits])

  const filtered = useMemo(() =>
    activeCategory === 'All' ? exhibits : exhibits.filter(e => e.category === activeCategory),
    [exhibits, activeCategory]
  )

  const liveCount = useMemo(() => filtered.filter((_, i) => isLive(i)).length, [filtered])

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      {/* Hero */}
      <section className="relative h-[65vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534567059665-cb530f259f6b?auto=format&fit=crop&q=80&w=2400"
            alt="Wildlife"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-16 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Cams Active
              </span>
              {!loading && (
                <span className="text-gray-400 text-sm">{liveCount} habitats streaming now</span>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
              Our <span className="text-green-400">Animals</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl font-light">
              Experience wildlife up close with live habitat cams, feeding schedules, and expert-led keeper talks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="sticky top-16 z-30 bg-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-2xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🦁</div>
            <p className="text-gray-400">No animal exhibits found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((exhibit, idx) => {
                const img = exhibit.image_url || categoryImages[exhibit.category] || defaultImage
                const live = isLive(idx)
                const zone = exhibit.zone || exhibit.category
                return (
                  <motion.div
                    key={exhibit.exhibit_id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    className="group cursor-pointer"
                    onClick={() => setSelected({ ...exhibit, live })}
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video">
                      <img
                        src={img}
                        alt={exhibit.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700"
                      />
                      {/* Scanline overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        {live ? (
                          <span className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="bg-gray-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                            SCHEDULED
                          </span>
                        )}
                      </div>

                      {/* Zone badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${zoneColorMap[zone] || 'bg-gray-100 text-gray-800'}`}>
                          {zone}
                        </span>
                      </div>

                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="text-white font-bold text-sm">{exhibit.name}</div>
                        <div className="text-gray-400 text-xs mt-0.5">{exhibit.category}</div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Animal Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-gray-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-64">
                <img
                  src={selected.image_url || categoryImages[selected.category] || defaultImage}
                  alt={selected.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition"
                >
                  ✕
                </button>
                {selected.live && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE NOW
                  </div>
                )}
                {selected.zone && (
                  <div className="absolute bottom-4 left-6">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${zoneColorMap[selected.zone] || 'bg-gray-100 text-gray-800'}`}>
                      {selected.zone}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-2xl font-black text-white">{selected.name}</h2>
                  <span className="text-xs font-semibold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {selected.location_name}
                  </span>
                </div>
                {selected.description && (
                  <p className="text-gray-400 leading-relaxed">{selected.description}</p>
                )}

                {selected.fun_fact && (
                  <div className="mt-5 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                    <div className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Fun Fact</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{selected.fun_fact}</p>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Link
                    to="/tickets"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl text-center text-sm transition"
                    onClick={() => setSelected(null)}
                  >
                    Book Tickets to See Them
                  </Link>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feeding Schedule */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-500/20 p-8">
          <div className="text-xs font-semibold text-green-400 tracking-widest uppercase mb-3">Daily Schedule</div>
          <h2 className="text-2xl font-black text-white mb-8">Feeding Times & Shows</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { time: '9:00 AM',  event: 'Bird Aviary Opens',   icon: '🦜' },
              { time: '10:00 AM', event: 'Tiger Enrichment',    icon: '🐯' },
              { time: '11:00 AM', event: 'Elephant Feeding',    icon: '🐘' },
              { time: '12:00 PM', event: 'Penguin Show',        icon: '🐧' },
              { time: '2:00 PM',  event: 'Reef Dive Show',      icon: '🐠' },
              { time: '3:00 PM',  event: 'Tiger Talk',          icon: '🐯' },
              { time: '4:00 PM',  event: 'Giraffe Feeding',     icon: '🦒' },
              { time: '5:00 PM',  event: 'Zoo Closes',          icon: '🔒' },
            ].map((item) => (
              <div key={item.time} className="flex items-center gap-3 bg-white/5 rounded-2xl p-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="text-green-400 font-bold text-sm">{item.time}</div>
                  <div className="text-gray-300 text-xs">{item.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
