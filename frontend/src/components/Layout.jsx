import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const meta = {
  '/dashboard':   { title: 'Dashboard',        icon: '🏠', desc: 'Overview of your visitor management system' },
  '/locations':   { title: 'Locations',         icon: '📍', desc: 'Manage your venues and facilities' },
  '/departments': { title: 'Departments',       icon: '🏢', desc: 'Organizational structure' },
  '/staff':       { title: 'Staff Management',  icon: '👤', desc: 'Your team members and shifts' },
  '/visitors':    { title: 'Visitors',          icon: '🧑‍🤝‍🧑', desc: 'Visitor registry and history' },
  '/tickets':     { title: 'Ticket Sales',      icon: '🎫', desc: 'Issue and manage tickets' },
  '/gate':        { title: 'Gate Management',   icon: '🚪', desc: 'Check-in / Check-out terminal' },
  '/visits':      { title: 'Visit Records',     icon: '🚶', desc: 'All visit activity logs' },
  '/reports':     { title: 'Reports & Analytics', icon: '📊', desc: 'Insights and data analytics' },
  '/incidents':   { title: 'Incident Reports',  icon: '⚠️', desc: 'Security and operational incidents' },
};

export default function Layout() {
  const loc = useLocation();
  const page = meta[loc.pathname] || { title: 'VMS', icon: '⬡', desc: '' };
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 px-8 py-0 flex items-center justify-between"
          style={{
            background: 'rgba(248,250,252,0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(226,232,240,0.8)',
            minHeight: '64px',
          }}>

          {/* Left: Page title */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{page.icon}</span>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">{page.title}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{page.desc}</p>
            </div>
          </div>

          {/* Right: Status + time */}
          <div className="flex items-center gap-4">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">System Live</span>
            </div>

            {/* Date/time */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700">
                {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-slate-400">
                {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8" style={{ background: '#f8fafc' }}>
          <div className="animate-page max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
