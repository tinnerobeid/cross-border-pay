import { useEffect, useState } from 'react'
import { getKYCRecords, approveKYC, rejectKYC, KYCRecord, getToken } from '../api'
import Badge, { statusVariant } from '../components/Badge'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function KYCCard({ record, onApprove, onReject }: {
  record: KYCRecord
  onApprove: (id: number, note: string) => Promise<void>
  onReject: (id: number, note: string) => Promise<void>
}) {
  const [note, setNote] = useState('')
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null)

  async function doApprove() {
    setActing('approve')
    await onApprove(record.id, note)
    setActing(null)
  }

  async function doReject() {
    if (!note.trim()) { alert('Please enter a rejection reason.'); return }
    if (!window.confirm('Reject this KYC submission?')) return
    setActing('reject')
    await onReject(record.id, note)
    setActing(null)
  }

  return (
    <div className="card overflow-hidden">
      {/* Status stripe */}
      <div className={`h-1 ${record.status === 'approved' ? 'bg-emerald-500' : record.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`} />

      <div className="p-5 space-y-4">
        {/* User info */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-800">{record.user_name || `User #${record.user_id}`}</p>
            <p className="text-xs text-slate-500">{record.user_email}</p>
          </div>
          <Badge label={record.status} variant={statusVariant(record.status)} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-3">
          {[
            { label: 'Country', value: record.country },
            { label: 'ID Type', value: record.id_type },
            { label: 'ID Number', value: record.id_number },
            { label: 'Submitted', value: record.submitted_at ? fmtDate(record.submitted_at) : '—' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-xs text-slate-400 uppercase tracking-wide">{row.label}</p>
              <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{row.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Review note if already reviewed */}
        {record.status !== 'pending' && record.review_note && (
          <div className={`px-3 py-2 rounded-lg text-sm ${record.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Review Note</p>
            <p>{record.review_note}</p>
            {record.reviewed_at && <p className="text-xs opacity-70 mt-1">{fmtDate(record.reviewed_at)}</p>}
          </div>
        )}

        {/* Actions for pending */}
        {record.status === 'pending' && (
          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Review Note <span className="text-red-400">(required for reject)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note (optional for approval, required for rejection)…"
                className="input-field resize-none text-xs"
                disabled={acting !== null}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={doApprove}
                disabled={acting !== null}
                className="btn-success flex-1 justify-center"
              >
                {acting === 'approve' ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
                {acting === 'approve' ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={doReject}
                disabled={acting !== null}
                className="btn-danger flex-1 justify-center"
              >
                {acting === 'reject' ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
                {acting === 'reject' ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KYC() {
  const token = getToken()!
  const [all, setAll] = useState<KYCRecord[]>([])
  const [tab, setTab] = useState<StatusFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    setLoading(true)
    getKYCRecords(token)
      .then(setAll)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  async function handleApprove(id: number, note: string) {
    try {
      const updated = await approveKYC(token, id, note)
      setAll(prev => prev.map(k => k.id === id ? { ...k, ...updated } : k))
      showToast('KYC approved successfully')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  async function handleReject(id: number, note: string) {
    try {
      const updated = await rejectKYC(token, id, note)
      setAll(prev => prev.map(k => k.id === id ? { ...k, ...updated } : k))
      showToast('KYC rejected')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const counts = {
    all: all.length,
    pending: all.filter(k => k.status === 'pending').length,
    approved: all.filter(k => k.status === 'approved').length,
    rejected: all.filter(k => k.status === 'rejected').length,
  }

  const visible = tab === 'all' ? all : all.filter(k => k.status === tab)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">KYC Review</h2>
        <span className="text-sm text-slate-500">{counts.pending} pending</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition flex items-center gap-1.5 ${tab === t ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
            <span className={`badge text-xs px-1.5 py-0 ${tab === t ? 'bg-slate-100 text-slate-600' : 'bg-white/60 text-slate-500'}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-40" /><div className="skeleton h-20 w-full" /><div className="skeleton h-10 w-full" /></div>)}
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          {tab === 'pending' ? (
            <>
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-semibold text-slate-700">All caught up!</p>
              <p className="text-slate-400 text-sm mt-1">No pending KYC submissions to review</p>
            </>
          ) : (
            <p className="text-slate-400">No {tab} submissions</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(k => (
            <KYCCard key={k.id} record={k} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
