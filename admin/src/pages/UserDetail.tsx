import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUserById, getUserTransfers, updateUserStatus, User, Transfer } from '../api'
import Badge, { roleVariant, statusVariant } from '../components/Badge'

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const token = localStorage.getItem('zuripay_admin_token') ?? ''

  const [user, setUser] = useState<User | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingTransfers, setLoadingTransfers] = useState(true)
  const [error, setError] = useState('')
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!id) return
    const uid = parseInt(id, 10)

    getUserById(token, uid)
      .then(setUser)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingUser(false))

    getUserTransfers(token, uid)
      .then((data) => setTransfers(data.slice(0, 10)))
      .catch(() => {}) // silently fail — transfers may not exist
      .finally(() => setLoadingTransfers(false))
  }, [id, token])

  async function handleToggleActive() {
    if (!user) return
    const action = user.is_active ? 'deactivate' : 'activate'
    if (user.is_active && !window.confirm(`Deactivate ${user.full_name}? They will not be able to log in.`)) return
    setToggling(true)
    try {
      const updated = await updateUserStatus(token, user.id, !user.is_active)
      setUser(updated)
    } catch (e: unknown) {
      alert(`Failed to ${action}: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setToggling(false)
    }
  }

  if (error) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="btn-secondary mb-4">← Back</button>
        <div className="alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          ← Back
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Detail</h2>
          <p className="text-sm text-gray-500">Full profile and transfer history</p>
        </div>
      </div>

      {/* User info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        {loadingUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="skeleton w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-56" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12" />)}
            </div>
          </div>
        ) : user ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
              {/* Avatar */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {(user.full_name || user.email)[0]?.toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{user.full_name || 'No name'}</h3>
                  <Badge label={user.role} variant={roleVariant(user.role)} />
                  <Badge label={user.is_active ? 'Active' : 'Inactive'} variant={statusVariant(user.is_active ? 'active' : 'inactive')} />
                  {user.is_verified && <Badge label="Verified" variant="green" />}
                </div>
                <p className="text-gray-500 text-sm">{user.email}</p>
                {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
              </div>

              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={toggling ? 'btn-secondary opacity-50' : user.is_active ? 'btn-danger' : 'btn-success'}
              >
                {toggling ? 'Updating…' : user.is_active ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <InfoItem label="User ID" value={`#${user.id}`} mono />
              <InfoItem label="Joined" value={new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <InfoItem label="KYC Verified" value={user.is_verified ? 'Yes' : 'No'} />
              <InfoItem label="Account Status" value={user.is_active ? 'Active' : 'Inactive'} />
            </div>
          </>
        ) : null}
      </div>

      {/* Transfers */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Last 10 Transfers</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">ID</th>
                <th className="table-th">Route</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Recipient</th>
                <th className="table-th">Provider</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransfers ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="skeleton h-4 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    <div className="text-3xl mb-1">💸</div>
                    <p>No transfers found</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="table-td font-mono text-xs text-gray-400">#{t.id}</td>
                    <td className="table-td">
                      <span className="text-xs font-medium text-gray-700">
                        {t.send_currency} → {t.receive_currency}
                      </span>
                      <br />
                      <span className="text-xs text-gray-400">{t.send_country} → {t.receive_country}</span>
                    </td>
                    <td className="table-td">
                      <span className="font-medium">{t.send_amount.toLocaleString()}</span>
                      <br />
                      <span className="text-xs text-gray-400">≈ {t.receive_amount.toLocaleString()} {t.receive_currency}</span>
                    </td>
                    <td className="table-td">
                      <span className="text-sm">{t.recipient_name}</span>
                      <br />
                      <span className="text-xs text-gray-400">{t.recipient_phone}</span>
                    </td>
                    <td className="table-td text-xs">{t.provider || '—'}</td>
                    <td className="table-td">
                      <Badge label={t.status} variant={statusVariant(t.status)} />
                      {t.fail_reason && (
                        <p className="text-xs text-red-500 mt-0.5" title={t.fail_reason}>
                          {t.fail_reason.slice(0, 30)}{t.fail_reason.length > 30 ? '…' : ''}
                        </p>
                      )}
                    </td>
                    <td className="table-td text-xs text-gray-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
