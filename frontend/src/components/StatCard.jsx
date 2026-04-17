const gradients = {
  indigo: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
  green:  'linear-gradient(135deg,#10b981 0%,#059669 100%)',
  amber:  'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)',
  rose:   'linear-gradient(135deg,#f43f5e 0%,#e11d48 100%)',
  sky:    'linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)',
  purple: 'linear-gradient(135deg,#a855f7 0%,#9333ea 100%)',
  teal:   'linear-gradient(135deg,#14b8a6 0%,#0d9488 100%)',
  orange: 'linear-gradient(135deg,#f97316 0%,#ea580c 100%)',
};

const shadows = {
  indigo: '0 8px 24px rgba(99,102,241,0.28)',
  green:  '0 8px 24px rgba(16,185,129,0.28)',
  amber:  '0 8px 24px rgba(245,158,11,0.28)',
  rose:   '0 8px 24px rgba(244,63,94,0.28)',
  sky:    '0 8px 24px rgba(14,165,233,0.28)',
  purple: '0 8px 24px rgba(168,85,247,0.28)',
  teal:   '0 8px 24px rgba(20,184,166,0.28)',
  orange: '0 8px 24px rgba(249,115,22,0.28)',
};

export default function StatCard({ title, value, icon, color = 'indigo', sub, trend }) {
  const bg  = gradients[color] || gradients.indigo;
  const sh  = shadows[color]   || shadows.indigo;

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden text-white transition-all duration-300 hover:-translate-y-1 cursor-default select-none"
      style={{ background: bg, boxShadow: sh }}>

      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20"
        style={{ background: 'rgba(255,255,255,0.4)' }} />
      <div className="absolute -bottom-6 -right-2 w-20 h-20 rounded-full opacity-10"
        style={{ background: 'rgba(255,255,255,0.4)' }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider truncate">{title}</p>
          <p className="text-3xl font-black text-white mt-1.5 leading-none tracking-tight">
            {value ?? '—'}
          </p>
          {sub && <p className="text-white/60 text-xs mt-1.5 font-medium">{sub}</p>}
          {trend !== undefined && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 text-xs font-semibold">
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend)}% vs yesterday</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0 ml-3">
          {icon}
        </div>
      </div>
    </div>
  );
}
