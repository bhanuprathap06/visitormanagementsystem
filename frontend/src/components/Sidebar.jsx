import { NavLink, useLocation } from 'react-router-dom';

const nav = [
  { to: '/dashboard',   emoji: '🏠', label: 'Dashboard',    sub: 'Overview' },
  { to: '/locations',   emoji: '📍', label: 'Locations',    sub: 'Venues' },
  { to: '/departments', emoji: '🏢', label: 'Departments',  sub: 'Structure' },
  { to: '/staff',       emoji: '👤', label: 'Staff',        sub: 'Team' },
  { to: '/visitors',    emoji: '🧑‍🤝‍🧑', label: 'Visitors',   sub: 'Registry' },
  { to: '/tickets',     emoji: '🎫', label: 'Tickets',      sub: 'Issue & manage' },
  { to: '/gate',        emoji: '🚪', label: 'Gate',         sub: 'Check in/out' },
  { to: '/visits',      emoji: '🚶', label: 'Visits',       sub: 'Records' },
  { to: '/reports',     emoji: '📊', label: 'Reports',      sub: 'Analytics' },
  { to: '/incidents',   emoji: '⚠️',  label: 'Incidents',   sub: 'Security' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0f172a 0%,#1a1040 60%,#0f172a 100%)' }}>

      {/* Background glow blobs */}
      <div className="absolute top-24 -left-6 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.18),transparent 70%)' }} />
      <div className="absolute bottom-32 -right-4 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.15),transparent 70%)' }} />

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base relative flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.45)' }}>
            V
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900
              animate-pulse" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none tracking-tight">VMS Portal</p>
            <p className="text-indigo-400 text-[11px] mt-0.5 font-medium">Visitor Management</p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p className="px-5 pt-5 pb-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em]">
        Main Menu
      </p>

      {/* Nav */}
      <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto pb-4">
        {nav.map(({ to, emoji, label, sub }) => {
          const active = pathname === to;
          return (
            <NavLink key={to} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group relative transition-all duration-200 select-none"
              style={active ? {
                background: 'linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.12))',
                boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)',
              } : {}}>

              {/* hover bg */}
              {!active && <span className="absolute inset-0 rounded-xl transition-all duration-200 group-hover:bg-white/[0.05]" />}

              {/* icon pill */}
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 transition-all duration-200
                ${active ? 'bg-indigo-500/25 shadow-lg shadow-indigo-500/20' : 'group-hover:bg-white/10'}`}>
                {emoji}
              </span>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-none transition-colors duration-200
                  ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                  {label}
                </p>
                <p className={`text-[11px] mt-0.5 transition-colors duration-200
                  ${active ? 'text-indigo-300' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {sub}
                </p>
              </div>

              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"
                  style={{ boxShadow: '0 0 6px rgba(129,140,248,0.8)' }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="mx-3 mb-4 rounded-xl p-3 border border-white/[0.07]"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">Admin</p>
            <p className="text-slate-500 text-[10px] truncate">VMS v1.0 · Live</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
            style={{ boxShadow: '0 0 6px rgba(52,211,153,0.7)' }} />
        </div>
      </div>
    </aside>
  );
}
