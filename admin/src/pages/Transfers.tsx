import { useEffect, useState, useRef } from 'react'
import { getTransfers, getPeriodStats, updateTransferStatus, exportTransfersCsv, Transfer, PeriodStats, getToken, TransfersFilter } from '../api'
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

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d: Date) {
  // Use local calendar date, not UTC — avoids timezone-shift on date boundaries
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function today() { return toISO(new Date()) }
function yesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1); return toISO(d)
}
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return toISO(d)
}
function startOfMonth() {
  const d = new Date(); d.setDate(1); return toISO(d)
}
function startOfLastMonth() {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return toISO(d)
}
function endOfLastMonth() {
  const d = new Date(); d.setDate(0); return toISO(d)   // day 0 = last day of prev month
}

type Preset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'all',        label: 'All time'   },
  { key: 'today',      label: 'Today'      },
  { key: 'yesterday',  label: 'Yesterday'  },
  { key: '7d',         label: 'Last 7 days'},
  { key: '30d',        label: 'Last 30 days'},
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'custom',     label: 'Custom…'    },
]

function presetToDates(p: Preset): { from: string; to: string } | null {
  switch (p) {
    case 'all':        return null
    case 'today':      return { from: today(),          to: today() }
    case 'yesterday':  return { from: yesterday(),      to: yesterday() }
    case '7d':         return { from: daysAgo(6),       to: today() }
    case '30d':        return { from: daysAgo(29),      to: today() }
    case 'this_month': return { from: startOfMonth(),   to: today() }
    case 'last_month': return { from: startOfLastMonth(), to: endOfLastMonth() }
    default:           return null
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── TransferRow ───────────────────────────────────────────────────────────────

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
        {t.send_currency !== 'KRW' && t.send_amount_krw != null && (
          <p className="text-xs text-slate-400">≈ ₩{t.send_amount_krw.toLocaleString()}</p>
        )}
        <p className="text-xs text-emerald-600">→ {t.receive_currency} {(t.receive_amount || 0).toLocaleString()}</p>
        {(t.fee_used ?? 0) > 0 ? (
          <p className="text-xs font-semibold text-violet-600 mt-0.5">
            Fee: {t.send_currency} {Number(t.fee_used).toLocaleString()}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5">Fee: Free</p>
        )}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Transfers() {
  const token = getToken()!
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Resolve active date range
  const activeDates = preset === 'custom'
    ? (customFrom || customTo ? { from: customFrom, to: customTo } : null)
    : presetToDates(preset)

  function loadAll(status: string, dates: { from: string; to: string } | null) {
    setLoading(true)
    setStatsLoading(true)

    const filters = {
      ...(status ? { status } : {}),
      ...(dates?.from ? { from_date: dates.from } : {}),
      ...(dates?.to ? { to_date: dates.to } : {}),
      limit: 100,
    }

    getTransfers(token, filters)
      .then(setTransfers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    getPeriodStats(token, dates?.from, dates?.to)
      .then(setPeriodStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }

  useEffect(() => { loadAll('', null) }, [token])

  function handleStatusChange(s: string) {
    setStatusFilter(s)
    loadAll(s, activeDates)
  }

  function handlePreset(p: Preset) {
    setPreset(p)
    if (p !== 'custom') {
      loadAll(statusFilter, presetToDates(p))
    }
  }

  function handleCustomApply() {
    const dates = customFrom || customTo ? { from: customFrom, to: customTo } : null
    loadAll(statusFilter, dates)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const filters: TransfersFilter = {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(activeDates?.from ? { from_date: activeDates.from } : {}),
        ...(activeDates?.to ? { to_date: activeDates.to } : {}),
      }
      await exportTransfersCsv(token, filters)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExporting(false)
    }
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

  const periodLabel = preset === 'all' ? 'All time'
    : preset === 'custom' ? 'Custom range'
    : PRESETS.find(p => p.key === preset)?.label ?? ''

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Transfers</h2>
          <span className="badge bg-slate-100 text-slate-600">{visible.length}</span>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Exporting…' : 'Download CSV'}
        </button>
      </div>

      {/* Date range presets */}
      <div className="card p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Period</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                preset === p.key
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="input-field text-sm py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">To</label>
              <input
                type="date"
                value={customTo}
                max={today()}
                onChange={e => setCustomTo(e.target.value)}
                className="input-field text-sm py-1.5"
              />
            </div>
            <button onClick={handleCustomApply} className="btn-primary text-sm py-1.5 px-4">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Transfers</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {statsLoading ? '—' : (periodStats?.transfer_count ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">
            {statsLoading ? '' : `${periodStats?.completed_count ?? 0} completed · ${periodLabel}`}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Volume</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            {statsLoading ? '—' : `₩${(periodStats?.total_volume ?? 0).toLocaleString()}`}
          </p>
          <p className="text-xs text-slate-400">all transfers · {periodLabel}</p>
        </div>
        <div className="card p-4 border-violet-200 bg-violet-50">
          <p className="text-xs text-violet-600 font-medium uppercase tracking-wide">Fees Earned</p>
          <p className="text-2xl font-bold text-violet-700 mt-1">
            {statsLoading ? '—' : `₩${(periodStats?.total_fees ?? 0).toLocaleString()}`}
          </p>
          <p className="text-xs text-violet-400">successful transfers · {periodLabel}</p>
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
