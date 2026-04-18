import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const typeConfig = {
  zoo: {
    label: 'Wildlife Park',
    gradient: 'from-emerald-600 to-teal-700',
    bgGradient: 'from-emerald-50 to-teal-50',
    image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&q=80&w=400',
  },
  museum: {
    label: 'Museum',
    gradient: 'from-amber-600 to-orange-700',
    bgGradient: 'from-amber-50 to-orange-50',
    image: 'https://images.unsplash.com/photo-1599587424231-2e1f6e35d2d9?auto=format&fit=crop&q=80&w=400',
  },
  botanical_garden: {
    label: 'Botanical Garden',
    gradient: 'from-lime-600 to-green-700',
    bgGradient: 'from-lime-50 to-green-50',
    image: 'https://images.unsplash.com/photo-1558293842-c4fd12bbb1e6?auto=format&fit=crop&q=80&w=400',
  },
  aquarium: {
    label: 'Aquarium',
    gradient: 'from-blue-600 to-cyan-700',
    bgGradient: 'from-blue-50 to-cyan-50',
    image: 'https://images.unsplash.com/photo-1520186994231-6ea0019d8ad2?auto=format&fit=crop&q=80&w=400',
  },
  park: {
    label: 'Park',
    gradient: 'from-green-600 to-emerald-700',
    bgGradient: 'from-green-50 to-emerald-50',
    image: 'https://images.unsplash.com/photo-1588880331179-bc9b99a5cb33?auto=format&fit=crop&q=80&w=400',
  },
  heritage_site: {
    label: 'Heritage Site',
    gradient: 'from-purple-600 to-pink-700',
    bgGradient: 'from-purple-50 to-pink-50',
    image: 'https://images.unsplash.com/photo-1580983553168-b7a5b46dc438?auto=format&fit=crop&q=80&w=400',
  },
}

export default function LocationCard({ location }) {
  const live = location?.live || {}
  const config = typeConfig[location?.location_type] || typeConfig.zoo
  const occupancyPct = Number(live.occupancy_pct || 0)

  const occupancyColor = occupancyPct < 30 ? 'text-emerald-500' : occupancyPct < 70 ? 'text-amber-500' : 'text-red-500'
  const occupancyBg = occupancyPct < 30 ? 'bg-emerald-500/10' : occupancyPct < 70 ? 'bg-amber-500/10' : 'bg-red-500/10'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group rounded-3xl border border-slate-200 bg-gradient-to-br ${config.bgGradient} overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300`}
    >
      {/* Header Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={config.image}
          alt={config.label}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-slate-900">
            {config.label}
          </span>
        </div>

        {/* Occupancy Badge */}
        <div className="absolute top-3 right-3">
          <div className={`${occupancyBg} backdrop-blur-sm px-3 py-1.5 rounded-full`}>
            <span className={`text-xs font-bold ${occupancyColor}`}>{occupancyPct}%</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
          {location.location_name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <span>{location.city}</span>
          <span className="text-slate-300">•</span>
          <span>{location.state}</span>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-3 text-center">
            <div className="text-xs text-slate-500">Inside</div>
            <div className="text-lg font-bold text-slate-900">{Number(live.current_inside || 0)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-3 text-center">
            <div className="text-xs text-slate-500">Available</div>
            <div className="text-lg font-bold text-emerald-600">{Number(live.remaining_tickets || 0)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-3 text-center">
            <div className="text-xs text-slate-500">Capacity</div>
            <div className="text-lg font-bold text-slate-700">{Number(location.capacity || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-200/60">
          <div className="text-xs text-slate-500">
            <div className="font-medium text-slate-700">Today</div>
            <div>{live.visit_date || new Date().toISOString().slice(0, 10)}</div>
          </div>
          <Link
            to="/tickets"
            className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${config.gradient} px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:shadow-xl hover:scale-105 transition-all duration-300`}
          >
            Book Now
            <span>→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
