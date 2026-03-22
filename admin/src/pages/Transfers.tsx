import { useEffect, useState } from 'react'
import { getTransfers, updateTransferStatus, Transfer } from '../api'
import Badge, { statusVariant } from '../components/Badge'

// Valid status transitions
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ['processing', 'failed', 'cancelled'],
  created: ['processing', 'failed', 'cancelled'],
  processing: ['sent', 'failed', 'cancelled'],
  sent: ['received', 'failed'],
  received: [],
  failed: [],
  cancelled: [],
}

function getNextStatuses(current: string): string[] {
  return TRANSITIONS[current] ?? TRANSITIONS[current.toLowerCase()] ?? []
}

interface UpdateState {
  id: number
  currentStatus: string
  selectedStatus: string
  failReason: string
  loading: boolean
}

const STATUS_OPTIONS = ['', 'CREATED', 'processing', 'sent', 'received', 'failed', 'cancelled']

export default function Transfers() {
  const token = localStorage.getItem('zuripay_admin_token') ?? ''

  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  function fetchTransfers() {
    setLoading(true)
    setError('')
    getTransfers(token, { status: statusFilter || undefined, limit: 100 })
      .then(setTransfers)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTransfers() }, [statusFilter])

  function openUpdate(t: Transfer) {
    const next = getNextStatuses(t.status)
    if (next.length === 0) return
    setUpdateState({
      id: t.id,
      currentStatus: t.status,
      selectedStatus: next[0],
      failReason: '',
      loading: false,
    })
  }

  async function submitUpdate() {
    if (!updateState) return
    setUpdateState((s) => s ? { ...s, loading: true } : null)
    try {
      const updated = await updateTransferStatus(
        token,
        updateState.id,
        updateState.selectedStatus,
        updateState.selectedStatus === 'failed' ? updateState.failReason : undefined
      )
      setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setSuccessMsg(`Transfer #${updated.id} status updated to "${updated.status}"`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setUpdateState(null)
    } catch (e: unknown) {
      alert(`Failed to update: ${e instanceof Error ? e.message : 'Unknown error'}`)
      setUpdateState((s) => s ? { ...s, loading: false } : null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Transfers</h2>
        <p className="text-sm text-gray-500 mt-0.5">Monitor and manage cross-border transfers</p>
      </div>

      {error && <div className="alert-error mb-4 flex items-center gap-2"><span>⚠️</span> {error}</div>}
      {successMsg && <div className="alert-success mb-4 flex items-center gap-2"><span>✅</span> {successMsg}</div>}

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        <label className="text-sm font-medium text-gray-600">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field max-w-[180px]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {!loading && `${transfers.length} result${transfers.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Inline status update form */}
      {updateState && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-semibold text-blue-800 text-sm mb-3">
            Update Transfer #{updateState.id} — Current: <span className="uppercase">{updateState.currentStatus}</span>
          </h4>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">New Status</label>
              <select
                value={updateState.selectedStatus}
                onChange={(e) => setUpdateState((s) => s ? { ...s, selectedStatus: e.target.value } : null)}
                className="input-field max-w-[180px]"
                disabled={updateState.loading}
              >
                {getNextStatuses(updateState.currentStatus).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {updateState.selectedStatus === 'failed' && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-blue-700 mb-1">Fail Reason</label>
                <input
                  type="text"
                  value={updateState.failReason}
                  onChange={(e) => setUpdateState((s) => s ? { ...s, failReason: e.target.value } : null)}
                  className="input-field"
                  placeholder="Reason for failure…"
                  disabled={updateState.loading}
                />
              </div>
            )}
            <button
              onClick={submitUpdate}
              disabled={updateState.loading}
              className="btn-primary"
            >
              {updateState.loading ? 'Saving…' : 'Update Status'}
            </button>
            <button
              onClick={() => setUpdateState(null)}
              disabled={updateState.loading}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">ID</th>
                <th className="table-th">User ID</th>
                <th className="table-th">Send</th>
                <th className="table-th">Receive</th>
                <th className="table-th hidden md:table-cell">Recipient</th>
                <th className="table-th hidden lg:table-cell">Provider</th>
                <th className="table-th">Status</th>
                <th className="table-th hidden md:table-cell">Date</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="skeleton h-4 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">💸</div>
                    <p className="font-medium">No transfers found</p>
                    <p className="text-sm">Try changing the status filter</p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const nextStatuses = getNextStatuses(t.status)
                  return (
                    <tr key={t.id} className="table-row">
                      <td className="table-td font-mono text-xs text-gray-400">#{t.id}</td>
                      <td className="table-td font-mono text-xs text-blue-500">#{t.user_id}</td>
                      <td className="table-td">
                        <span className="font-medium text-sm">
                          {t.send_amount.toLocaleString()} {t.send_currency}
                        </span>
                        <br />
                        <span className="text-xs text-gray-400">{t.send_country}</span>
                      </td>
                      <td className="table-td">
                        <span className="font-medium text-sm">
                          {t.receive_amount.toLocaleString()} {t.receive_currency}
                        </span>
                        <br />
                        <span className="text-xs text-gray-400">{t.receive_country}</span>
                      </td>
                      <td className="table-td hidden md:table-cell">
                        <span className="text-sm">{t.recipient_name}</span>
                        <br />
                        <span className="text-xs text-gray-400">{t.recipient_phone}</span>
                      </td>
                      <td className="table-td hidden lg:table-cell text-xs text-gray-500">
                        {t.provider || '—'}
                      </td>
                      <td className="table-td">
                        <Badge label={t.status} variant={statusVariant(t.status)} />
                        {t.fail_reason && (
                          <p
                            className="text-xs text-red-500 mt-0.5 max-w-[120px] truncate"
                            title={t.fail_reason}
                          >
                            {t.fail_reason}
                          </p>
                        )}
                      </td>
                      <td className="table-td hidden md:table-cell text-xs text-gray-500">
                        {new Date(t.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-gray-400">
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="table-td">
                        {nextStatuses.length > 0 ? (
                          <button
                            onClick={() => openUpdate(t)}
                            disabled={updateState?.id === t.id}
                            className="btn-secondary text-xs px-2.5 py-1.5"
                          >
                            Update
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Final</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && transfers.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
            <span>{transfers.length} transfer{transfers.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-300">|</span>
            <span>
              Total sent:{' '}
              {transfers.reduce((sum, t) => sum + t.send_amount, 0).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
