import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setVisitorToken } from '../api/index.js'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) return setError('Valid email is required')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setLoading(true)
    try {
      const d = await api.post('/public/register', { email, password })
      if (d?.data?.success === false) {
        setError(d?.data?.message || 'Registration failed')
        return
      }
      const token = d?.data?.data?.token
      if (token) setVisitorToken(token)
      navigate('/tickets')
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Image Side */}
        <div className="relative hidden lg:block order-2 lg:order-1">
          <img
            src="https://images.unsplash.com/photo-1518182170546-0766ce6fec56?auto=format&fit=crop&q=80&w=1200"
            alt="Adventure"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 to-teal-800/90" />
          <div className="relative z-10 h-full flex flex-col justify-end p-10 text-white">
            <h2 className="text-3xl font-black mb-3">Join VMS Tours</h2>
            <p className="text-white/80 text-lg">
              Create an account to save your booking history and access exclusive features.
            </p>
            <div className="mt-8 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <span>Save bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <span>Quick rebooking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <span>Priority support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-10 order-1 lg:order-2">
          <div className="mb-8">
            <div className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">Visitor Account</div>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Create Account</h1>
            <p className="mt-2 text-slate-600">
              Join thousands of happy visitors booking amazing experiences.
            </p>
          </div>

          <form onSubmit={onSubmit} className="grid gap-5">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="Repeat your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl px-5 py-4 text-sm font-bold transition-all ${
                loading
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02]'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">
                Login
              </Link>
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900 mb-1">Already registered?</div>
            <p className="text-sm text-slate-600 mb-3">Login to access your tickets and booking history.</p>
            <Link
              to="/login"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-600 transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
