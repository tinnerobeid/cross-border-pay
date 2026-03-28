import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUserById, getUserTransfers, updateUserStatus, User, Transfer, getToken } from '../api'
import Badge, { roleVariant, statusVariant } from '../components/Badge'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = getToken()!
  const [user, setUser] = useState<User | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!id) return
    const uid = parseInt(id)
    Promise.all([getUserById(token, uid), getUserTransfers(token, uid)])
      .then(([u, t]) => { setUser(u); setTransfers(t) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, token])

  async function toggleStatus() {
    if (!user) return
    if (!window.confirm(`${user.is_active ? 'Deactivate' : 'Activate'} ${user.full_name}?`)) return
    setToggling(true)
    try {
      const updated = await updateUserStatus(token, user.id, !user.is_active)
      setUser(updated)
      setToast(`Account ${updated.is_active ? 'activated' : 'deactivated'}`)
      setTimeout(() => setToast(''), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}</div>
          <div className="lg:col-span-2 card p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 w-full" />)}</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="card p-8 text-center text-slate-500">User not found. <button onClick={() => navigate('/users')} className="text-blue-600 underline">Back to users</button></div>
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/users" className="text-slate-500 hover:text-slate-700">Users</Link>
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="font-medium text-slate-800 truncate">{user.full_name}</span>
      </nav>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="card p-6 flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {initials(user.full_name)}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">{user.full_name}</h2>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge label={user.role} variant={roleVariant(user.role)} />
              <Badge label={user.is_active ? 'Active' : 'Inactive'} variant={user.is_active ? 'green' : 'red'} />
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            {[
              { label: 'Phone', value: user.phone || '—' },
              { label: 'Verified', value: user.is_verified ? '✓ Yes' : '✗ No' },
              { label: 'User ID', value: `#${user.id}` },
              { label: 'Joined', value: fmtDate(user.created_at) },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className="font-medium text-slate-700 text-right">{row.value}</span>
              </div>
            ))}
          </div>

          {user.role !== 'admin' && (
            <button
              onClick={toggleStatus}
              disabled={toggling}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                user.is_active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
              } disabled:opacity-50`}
            >
              {toggling ? 'Updating…' : user.is_active ? 'Deactivate Account' : 'Activate Account'}
            </button>
          )}
        </div>

        {/* Transfers */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Transfer History</h3>
            <p className="text-xs text-slate-400 mt-0.5">{transfers.length} total transfers</p>
          </div>
          {transfers.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">No transfers yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['ID', 'Recipient', 'Amount', 'Receives', 'Status', 'Date'].map(h => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.id} className="tr">
                      <td className="td font-mono text-xs text-slate-500">#ZP-{t.id}</td>
                      <td className="td">
                        <p className="font-medium text-slate-800">{t.recipient_name}</p>
                        <p className="text-xs text-slate-400">{t.recipient_phone}</p>
                      </td>
                      <td className="td font-medium">{t.send_currency} {t.send_amount.toLocaleString()}</td>
                      <td className="td text-emerald-600 font-medium">{t.receive_currency} {(t.receive_amount || 0).toLocaleString()}</td>
                      <td className="td"><Badge label={t.status} variant={statusVariant(t.status)} /></td>
                      <td className="td text-xs text-slate-400">{fmtDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
