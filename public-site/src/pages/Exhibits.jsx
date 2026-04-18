import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { api, extractData } from '../api/index.js'

const categoryImages = {
  'Big Cats': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&q=80&w=800',
  'Herbivores': 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=800',
  'Birds': 'https://images.unsplash.com/photo-1522748906645-95d8adfa52c1?auto=format&fit=crop&q=80&w=800',
  'Aquatic': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
  'Artifacts': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&q=80&w=800',
  'Plants': 'https://images.unsplash.com/photo-1585225605900-235d5a2c3d3a?auto=format&fit=crop&q=80&w=800',
  'Insects': 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&q=80&w=800',
  'Special Exhibit': 'https://images.unsplash.com/photo-1518182170546-0766ce6fec56?auto=format&fit=crop&q=80&w=800',
  'Primates': 'https://images.unsplash.com/photo-1540205082460-e8f00034a7eb?auto=format&fit=crop&q=80&w=800',
  'Reptiles': 'https://images.unsplash.com/photo-1535074151861-5a67e2953813?auto=format&fit=crop&q=80&w=800',
}

const defaultImage = 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&q=80&w=800'

const FALLBACK = [
  { exhibit_id: 'f1', location_id: 1, location_name: 'Chennai Wildlife Park', name: 'Bengal Tiger', category: 'Big Cats', zone: 'Asia', fun_fact: 'Tigers have striped skin, not just fur.', image_url: categoryImages['Big Cats'] },
  { exhibit_id: 'f2', location_id: 1, location_name: 'Chennai Wildlife Park', name: 'Asian Elephant', category: 'Herbivores', zone: 'Asia', fun_fact: 'Elephants recognise themselves in mirrors.', image_url: categoryImages['Herbivores'] },
  { exhibit_id: 'f3', location_id: 1, location_name: 'Chennai Wildlife Park', name: 'Lion Savannah', category: 'Big Cats', zone: 'Africa', fun_fact: "A lion's roar carries up to 8 km.", image_url: categoryImages['Big Cats'] },
  { exhibit_id: 'f4', location_id: 2, location_name: 'National Museum Chennai', name: 'Ancient Sculptures', category: 'Artifacts', zone: 'History Hall', fun_fact: 'Some sculptures are over 1000 years old.', image_url: categoryImages['Artifacts'] },
  { exhibit_id: 'f5', location_id: 2, location_name: 'National Museum Chennai', name: 'Penguin Cove', category: 'Special Exhibit', zone: 'Aquarium', fun_fact: 'Penguins have excellent underwater vision.', image_url: categoryImages['Aquatic'] },
  { exhibit_id: 'f6', location_id: 3, location_name: 'Botanical Garden Ooty', name: 'Orchid House', category: 'Plants', zone: 'Greenhouse', fun_fact: 'Orchids can live for decades.', image_url: categoryImages['Plants'] },
  { exhibit_id: 'f7', location_id: 3, location_name: 'Botanical Garden Ooty', name: 'Butterfly Walk', category: 'Insects', zone: 'Meadow', fun_fact: 'Butterflies taste with their feet.', image_url: categoryImages['Insects'] },
  { exhibit_id: 'f8', location_id: 1, location_name: 'Chennai Wildlife Park', name: 'Chimpanzee Family', category: 'Primates', zone: 'Africa', fun_fact: 'Chimps share 98% of human DNA.', image_url: categoryImages['Primates'] },
  { exhibit_id: 'f9', location_id: 1, location_name: 'Chennai Wildlife Park', name: 'King Cobra', category: 'Reptiles', zone: 'Asia', fun_fact: 'King Cobras can grow up to 18 feet.', image_url: categoryImages['Reptiles'] },
]

const liveStreams = [
  { name: 'Elephant Enclosure', img: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&q=80&w=1200', live: true },
  { name: 'Tiger Reserve', img: 'https://images.unsplash.com/photo-1549471156-52c730878ea2?auto=format&fit=crop&q=80&w=1200', live: true },
  { name: 'Primate Paradise', img: 'https://images.unsplash.com/photo-1540205082460-e8f00034a7eb?auto=format&fit=crop&q=80&w=1200', live: false },
  { name: 'Bird Aviary', img: 'https://images.unsplash.com/photo-1522748906645-95d8adfa52c1?auto=format&fit=crop&q=80&w=1200', live: false },
]

export default function Exhibits() {
  const [exhibits, setExhibits] = useState([])
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)
  const [loc, setLoc] = useState('all')
  const [cat, setCat] = useState('all')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await api.get('/public/exhibits')
        const rows = extractData(r) || []
        if (!alive) return
        if (rows.length === 0) {
          setExhibits(FALLBACK)
          setErrored(true)
        } else {
          setExhibits(rows)
        }
      } catch (e) {
        if (!alive) return
        setExhibits(FALLBACK)
        setErrored(true)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const locations = useMemo(
    () => ['all', ...Array.from(new Set(exhibits.map((e) => e.location_name || 'Unknown')))],
    [exhibits],
  )
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(exhibits.map((e) => e.category).filter(Boolean)))],
    [exhibits],
  )

  const filtered = useMemo(
    () => exhibits.filter((e) =>
      (loc === 'all' ? true : (e.location_name || 'Unknown') === loc) &&
      (cat === 'all' ? true : e.category === cat)
    ),
    [loc, cat, exhibits],
  )

  return (
    <div>
      {/* HERO SECTION */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&q=80&w=2000"
            alt="Our Animals"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 px-4 py-2 mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-white">Live Streaming Available</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight"
          >
            Our Animals
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-lg text-white/80 max-w-2xl mx-auto"
          >
            Explore our wildlife exhibits and watch live streams of your favorite animals from anywhere.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <Link
              to="/tickets"
              className="px-8 py-4 rounded-full bg-amber-500 text-slate-900 font-bold text-lg hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25"
            >
              Book Your Visit
            </Link>
          </motion.div>
        </div>
      </section>

      {/* LIVE STREAMING SECTION */}
      <section className="bg-slate-950 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold tracking-widest text-red-400 uppercase flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Live Now
              </div>
              <div className="mt-1 text-3xl font-bold text-white">Live Streaming</div>
              <div className="mt-1 text-sm text-slate-400">Watch our animals in real-time.</div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {liveStreams.map((stream, idx) => (
              <motion.div
                key={stream.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-3xl cursor-pointer aspect-video"
              >
                <img
                  src={stream.img}
                  alt={stream.name}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity duration-500"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">{stream.name}</h3>
                    {stream.live && (
                      <span className="flex items-center gap-1 rounded-full bg-red-500/20 border border-red-400/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        LIVE
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EXHIBITS GRID */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold tracking-widest text-amber-600 uppercase">Explore</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">All Exhibits</div>
            <div className="mt-1 text-sm text-slate-600">Filter by location and category.</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              {locations.map((x) => (
                <option key={x} value={x}>
                  {x === 'all' ? 'All locations' : x}
                </option>
              ))}
            </select>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              {categories.map((x) => (
                <option key={x} value={x}>
                  {x === 'all' ? 'All categories' : x}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errored ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 mb-6">
            Showing sample exhibits. Add real data to the EXHIBIT table for live content.
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-3xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-48 bg-slate-200" />
                <div className="p-4">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e, i) => {
              const exhibitImage = e.image_url || categoryImages[e.category] || defaultImage
              return (
                <motion.div
                  key={e.exhibit_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="group rounded-3xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={exhibitImage}
                      alt={e.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {e.zone && (
                      <span className="absolute bottom-3 left-3 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-800">
                        {e.zone}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-semibold text-amber-600 mb-1">{e.location_name || 'Unknown'}</div>
                    <h3 className="text-lg font-bold text-slate-900">{e.name}</h3>
                    {e.category && (
                      <div className="mt-1 text-xs text-slate-500">{e.category}</div>
                    )}
                    {e.description ? (
                      <div className="mt-2 text-sm text-slate-700 line-clamp-2">{e.description}</div>
                    ) : null}
                    {e.fun_fact ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Did you know:</span> {e.fun_fact}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
            {filtered.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <div className="text-slate-400 text-sm">No exhibits match the current filters.</div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}