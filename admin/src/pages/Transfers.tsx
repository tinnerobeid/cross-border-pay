import { useEffect, useState, useRef } from 'react'
import { getTransfers, updateTransferStatus, Transfer, getToken } from '../api'
import Badge, { statusVariant } from '../components/Badge'

const TRANSITIONS: Record<string, string[]> = {
  CREATED: ['processing', 'failed', 'cancelled'],
  initiated: ['processing', 'failed', 'cancelled'],
  payment_pending: ['processing', 'failed', 'cancelled'],
  processing: ['sent', 'failed'],
  sent: ['received', 'failed'],
  received: [],
  failed: [],
  cancelled: [],
  CANCELLED: [],
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function TransferRow({ t, onUpdate }: { t: Transfer; onUpdate: (updated: Transfer) => void }) {
  const token = getToken()!
  const [acting, setActing] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [failReason, setFailReason] = useState('')
  const [error, setError] = useState('')

  const nextStatuses = TRANSITIONS[t.status] || []

  async function doUpdate() {
    if (!selectedStatus) return
    setActing(true)
    setError('')
    try {
      const updated = await updateTransferStatus(token, t.id, selectedStatus, selectedStatus === 'failed' ? failReason : undefined)
      onUpdate(updated)
      setSelectedStatus('')
      setFailReason('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setActing(false)
    }
  }

  return (
    <tr className="tr align-top">
      <td className="td font-mono text-xs text-slate-500 pt-4">#ZP-{t.id}</td>
      <td className="td">
        <p className="font-medium text-slate-800">{t.recipient_name}</p>
        <p className="text-xs text-slate-400">{t.recipient_phone}</p>
      </td>
      <td className="td">
        <p className="text-xs text-slate-500">{t.send_country} → {t.receive_country}</p>
        <p className="text-xs font-medium text-slate-600">{t.send_currency}/{t.receive_currency}</p>
      </td>
      <td className="td">
        <p className="font-semibold text-slate-800">{t.send_currency} {t.send_amount.toLocaleString()}</p>
        <p className="text-xs text-emerald-600">→ {t.receive_currency} {(t.receive_amount || 0).toLocaleString()}</p>
        <p className="text-xs text-slate-400">Fee: {t.fee_used}</p>
      </td>
      <td className="td text-xs text-slate-500">{t.rate_used}</td>
      <td className="td">
        <div className="space-y-1.5">
          <Badge label={t.status} variant={statusVariant(t.status)} />
          {t.fail_reason && <p className="text-xs text-red-500 max-w-[140px] truncate" title={t.fail_reason}>{t.fail_reason}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </td>
      <td className="td text-xs text-slate-400 whitespace-nowrap">{fmtDate(t.created_at)}</td>
      <td className="td">
        {nextStatuses.length > 0 ? (
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="input-field text-xs py-1.5"
              disabled={acting}
            >
              <option value="">Move to…</option>
              {nextStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {selectedStatus === 'failed' && (
              <input
                type="text"
                placeholder="Fail reason (required)"
                value={failReason}
                onChange={e => setFailReason(e.target.value)}
                className="input-field text-xs py-1.5"
                disabled={acting}
              />
            )}
            {selectedStatus && (
              <button onClick={doUpdate} disabled={acting || (selectedStatus === 'failed' && !failReason)} className="btn-primary text-xs py-1.5 justify-center">
                {acting ? 'Updating…' : 'Update'}
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Terminal</span>
        )}
      </td>
    </tr>
  )
}

export default function Transfers() {
  const token = getToken()!
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  function load(status: string) {
    setLoading(true)
    getTransfers(token, { ...(status ? { status } : {}), limit: 100 })
      .then(setTransfers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load('') }, [token])

  function handleStatusChange(s: string) {
    setStatusFilter(s)
    load(s)
  }

  function handleSearch(v: string) {
    setSearch(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {}, 400)
  }

  const visible = search
    ? transfers.filter(t =>
        t.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
        t.recipient_phone.includes(search)
      )
    : transfers

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Transfers</h2>
          <span className="badge bg-slate-100 text-slate-600">{visible.length}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search recipient…" value={search} onChange={e => handleSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <select value={statusFilter} onChange={e => handleStatusChange(e.target.value)} className="input-field max-w-[180px]">
          <option value="">All statuses</option>
          {['CREATED', 'initiated', 'processing', 'sent', 'received', 'failed', 'cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {['ID', 'Recipient', 'Route', 'Amount', 'Rate', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {[...Array(8)].map((_, j) => <td key={j} className="td"><div className="skeleton h-4 w-full max-w-[100px]" /></td>)}
                  </tr>
                ))
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">No transfers found</td>
                </tr>
              ) : (
                visible.map(t => (
                  <TransferRow key={t.id} t={t} onUpdate={updated => setTransfers(prev => prev.map(x => x.id === updated.id ? updated : x))} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
