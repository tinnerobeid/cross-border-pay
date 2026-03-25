import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkSetupStatus, setupFirstAdmin } from '../api'

export default function Setup() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [alreadySetup, setAlreadySetup] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    // If already logged in, go to dashboard
    if (localStorage.getItem('zuripay_admin_token')) {
      navigate('/dashboard', { replace: true })
      return
    }
    checkSetupStatus()
      .then(({ admin_exists }) => {
        if (admin_exists) setAlreadySetup(true)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [navigate])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const { access_token } = await setupFirstAdmin({
        email: form.email,
        full_name: form.full_name,
        phone: form.phone || undefined,
        password: form.password,
      })
      localStorage.setItem('zuripay_admin_token', access_token)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (alreadySetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Already Configured</h2>
          <p className="text-slate-500 text-sm mb-5">An admin account already exists. Please sign in.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-slate-900 p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">Z</div>
          <span className="text-white font-bold text-lg">ZuriPay</span>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
            First-Time Setup
          </div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Welcome to<br />ZuriPay Admin.
          </h2>
          <p className="text-slate-400 text-base">
            Create your admin account to get started. This setup screen will disappear after the first admin is created.
          </p>
        </div>
        <p className="text-slate-600 text-xs">ZuriPay Operations Center · Secure Setup</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">Z</div>
            <span className="font-bold text-xl text-slate-800">ZuriPay Setup</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Create Admin Account</h1>
            <p className="text-slate-500 text-sm">This will be the primary administrator of the platform.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className="input-field" placeholder="e.g. John Mwangi" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="input-field" placeholder="admin@zuripay.com" required disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="input-field" placeholder="+255 700 000 000" disabled={loading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="input-field pr-10" placeholder="Min. 8 characters" required minLength={8} disabled={loading} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input type={showPw ? 'text' : 'password'} value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                className="input-field" placeholder="Re-enter password" required disabled={loading} />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base mt-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </>
              ) : 'Create Admin Account & Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-6">
            Already have an account? <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  )
}
