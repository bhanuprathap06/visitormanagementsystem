import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setVisitorToken } from '../api/index.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const d = await api.post('/public/login', { email, password })
      if (d?.data?.success === false) { setError(d?.data?.message || 'Login failed'); return }
      const token = d?.data?.data?.token
      if (token) setVisitorToken(token)
      navigate('/my-tickets')
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — immersive image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1549471156-52c730878ea2?auto=format&fit=crop&q=80&w=1200"
          alt="Wildlife"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/90 via-emerald-800/80 to-teal-900/90" />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-white text-lg">V</div>
            <span className="text-white font-black text-xl tracking-tight">VMS<span className="font-light">Tours</span></span>
          </div>
          <div>
            <div className="text-green-300 text-sm font-semibold tracking-widest uppercase mb-4">Visitor Portal</div>
            <h1 className="text-4xl font-black text-white mb-4 leading-tight">
              Book tickets, explore animals & manage your visits
            </h1>
            <p className="text-green-200 text-lg font-light mb-10">
              Login to book tickets, track your visit history, and submit queries — all in one place.
            </p>
            <div className="flex flex-col gap-3">
              {['Instant QR ticket generation', 'Real-time slot availability', 'Download tickets anytime', 'Submit & track support queries'].map(f => (
                <div key={f} className="flex items-center gap-3 text-white/80 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500/30 border border-green-400/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">Visitor Account</div>
            <h2 className="text-3xl font-black text-gray-900">Login</h2>
            <p className="text-gray-500 mt-2">Login to book tickets, adopt animals and submit your queries.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email ID or Mobile Number</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your Email ID"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your Password"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 pr-12 text-sm bg-gray-50 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="text-right mt-2">
                <a href="#" className="text-xs text-green-600 font-semibold hover:underline">Reset Password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl text-sm transition-all hover:shadow-lg disabled:bg-gray-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>

            <div className="relative flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              disabled
              title="Google login coming soon"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white text-gray-600 font-semibold py-3.5 rounded-2xl text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign up with Google
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            If you don't have an account?{' '}
            <Link to="/register" className="font-bold text-green-600 hover:text-green-700">
              Create Account
            </Link>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">Want to explore without an account?</p>
            <Link
              to="/tickets"
              className="inline-block text-sm font-semibold text-green-700 border border-green-200 bg-white px-5 py-2 rounded-xl hover:bg-green-50 transition"
            >
              Book as Guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
