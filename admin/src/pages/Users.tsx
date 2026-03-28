import { useEffect, useState, useCallback, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUsers, updateUserStatus, createUser, User, getToken } from '../api'
import Badge, { roleVariant } from '../components/Badge'

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const token = getToken()!
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role: 'user' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await createUser(token, { ...form, phone: form.phone || undefined })
      onCreated(user)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="card w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">Create New User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
            <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input-field" placeholder="e.g. Jane Doe" required disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-field" placeholder="user@example.com" required disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="input-field" placeholder="+255 700 000 000" disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-field" placeholder="Min. 8 characters" required minLength={8} disabled={loading} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)} className="input-field" disabled={loading}>
              <option value="user">User (mobile app customer)</option>
              <option value="admin">Admin (operations panel access)</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Creating…' : 'Create User'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type ActiveFilter = 'all' | 'active' | 'inactive'
type VerifiedFilter = 'all' | 'verified' | 'unverified'

export default function Users() {
  const navigate = useNavigate()
  const token = getToken()!
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<ActiveFilter>('all')
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('all')
  const [toggling, setToggling] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback((q: string, act: ActiveFilter, ver: VerifiedFilter) => {
    setLoading(true)
    setError('')
    const filters: Record<string, unknown> = {}
    if (q) filters.search = q
    if (act === 'active') filters.is_active = true
    if (act === 'inactive') filters.is_active = false
    if (ver === 'verified') filters.is_verified = true
    if (ver === 'unverified') filters.is_verified = false
    getUsers(token, filters)
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { load('', 'all', 'all') }, [load])

  function handleSearch(v: string) {
    setSearch(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(v, activeTab, verifiedFilter), 400)
  }

  function handleTab(t: ActiveFilter) {
    setActiveTab(t)
    load(search, t, verifiedFilter)
  }

  function handleVerified(v: VerifiedFilter) {
    setVerifiedFilter(v)
    load(search, activeTab, v)
  }

  async function toggleStatus(u: User) {
    setToggling(u.id)
    try {
      const updated = await updateUserStatus(token, u.id, !u.is_active)
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x))
      setToast(`${updated.full_name} ${updated.is_active ? 'activated' : 'deactivated'}`)
      setTimeout(() => setToast(''), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={u => { setUsers(prev => [u, ...prev]); setShowCreate(false); setToast(`${u.full_name} created successfully`) ; setTimeout(() => setToast(''), 3000) }}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Users</h2>
          <span className="badge bg-slate-100 text-slate-600">{users.length}</span>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create User
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as ActiveFilter[]).map(t => (
            <button key={t} onClick={() => handleTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${activeTab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['all', 'verified', 'unverified'] as VerifiedFilter[]).map(t => (
            <button key={t} onClick={() => handleVerified(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${verifiedFilter === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {['User', 'Phone', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="td"><div className="skeleton h-4 w-full max-w-[120px]" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No users found</td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="tr">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(u.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate max-w-[140px]">{u.full_name}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[140px]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-slate-500">{u.phone || '—'}</td>
                  <td className="td"><Badge label={u.role} variant={roleVariant(u.role)} /></td>
                  <td className="td">
                    {u.is_verified ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Not verified</span>
                    )}
                  </td>
                  <td className="td">
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={toggling === u.id || u.role === 'admin'}
                      title={u.role === 'admin' ? 'Cannot change admin status' : ''}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${u.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="td text-slate-500 text-xs">{fmtDate(u.created_at)}</td>
                  <td className="td">
                    <button onClick={() => navigate(`/users/${u.id}`)} className="btn-ghost text-xs py-1.5 px-3">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50 animate-pulse">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
