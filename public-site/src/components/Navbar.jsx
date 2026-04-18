import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getVisitorToken, setVisitorToken } from '../api/index.js'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/tickets', label: 'Book Tickets' },
  { to: '/exhibits', label: 'Exhibits' },
  { to: '/events', label: 'Events' },
  { to: '/animals', label: 'Our Animals' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const authed = Boolean(getVisitorToken())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  const onLogout = () => {
    setVisitorToken(null)
    navigate('/login')
  }

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-colors',
        scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200' : 'bg-transparent',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-nature-800 to-amberBrand-500 shadow-md" />
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">VMS Tours</div>
              <div className="text-xs text-slate-600">Zoo • Museum • Garden</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  [
                    'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive ? 'bg-nature-800 text-white' : 'text-slate-700 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {authed ? (
              <>
                <Link
                  to="/my-tickets"
                  className="px-3 py-2 rounded-xl text-sm font-semibold bg-amberBrand-500 hover:bg-amberBrand-600 text-slate-900 transition-colors"
                >
                  My Tickets
                </Link>

                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-xl text-sm font-semibold bg-nature-800 hover:bg-nature-700 text-white transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden h-10 w-10 rounded-xl border border-slate-200 bg-white/80 backdrop-blur flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1.5">
              <div className="h-0.5 w-5 bg-slate-800" />
              <div className="h-0.5 w-5 bg-slate-800" />
              <div className="h-0.5 w-5 bg-slate-800" />
            </div>
          </button>
        </div>

        {open && (
          <div className="lg:hidden pb-4">
            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {navItems.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    [
                      'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive ? 'bg-nature-800 text-white' : 'text-slate-700 hover:bg-slate-100',
                    ].join(' ')
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <div className="h-px bg-slate-200 my-1" />
              {getVisitorToken() ? (
                <>
                  <Link to="/my-tickets" className="px-3 py-2 rounded-xl text-sm font-semibold bg-amberBrand-500 text-slate-900">
                    My Tickets
                  </Link>
                  <button
                    onClick={onLogout}
                    className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white">
                    Login
                  </Link>
                  <Link to="/register" className="px-3 py-2 rounded-xl text-sm font-semibold bg-nature-800 text-white">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

