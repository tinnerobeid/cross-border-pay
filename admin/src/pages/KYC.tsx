import { useEffect, useState } from 'react'
import { getKYCRecords, approveKYC, rejectKYC, KYCRecord } from '../api'
import Badge, { statusVariant } from '../components/Badge'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

interface ReviewState {
  id: number
  action: 'approve' | 'reject'
  note: string
  loading: boolean
}

export default function KYC() {
  const token = localStorage.getItem('zuripay_admin_token') ?? ''

  const [records, setRecords] = useState<KYCRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [review, setReview] = useState<ReviewState | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  function fetchRecords(status: StatusFilter) {
    setLoading(true)
    setError('')
    const s = status === 'all' ? undefined : status
    getKYCRecords(token, s)
      .then(setRecords)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRecords(filter) }, [filter])

  function startReview(id: number, action: 'approve' | 'reject') {
    if (action === 'reject') {
      if (!window.confirm('Reject this KYC application? This action will notify the user.')) return
    }
    setReview({ id, action, note: '', loading: false })
  }

  function cancelReview() { setReview(null) }

  async function submitReview() {
    if (!review) return
    setReview((r) => r ? { ...r, loading: true } : null)

    try {
      const fn = review.action === 'approve' ? approveKYC : rejectKYC
      const updated = await fn(token, review.id, review.note)
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setSuccessMsg(`KYC ${review.action === 'approve' ? 'approved' : 'rejected'} successfully.`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setReview(null)
    } catch (e: unknown) {
      alert(`Failed to ${review.action}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      setReview((r) => r ? { ...r, loading: false } : null)
    }
  }

  const tabs: StatusFilter[] = ['all', 'pending', 'approved', 'rejected']

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">KYC Reviews</h2>
        <p className="text-sm text-gray-500 mt-0.5">Verify user identity documents</p>
      </div>

      {error && <div className="alert-error mb-4 flex items-center gap-2"><span>⚠️</span> {error}</div>}
      {successMsg && <div className="alert-success mb-4 flex items-center gap-2"><span>✅</span> {successMsg}</div>}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === t ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Inline review form */}
      {review && (
        <div className={`mb-4 rounded-xl border p-4 ${review.action === 'approve' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h4 className={`font-semibold text-sm mb-2 ${review.action === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
            {review.action === 'approve' ? '✅ Approve KYC' : '❌ Reject KYC'} — KYC #{review.id}
          </h4>
          <textarea
            value={review.note}
            onChange={(e) => setReview((r) => r ? { ...r, note: e.target.value } : null)}
            className="input-field mb-3 resize-none"
            rows={2}
            placeholder={`Review note (optional)…`}
            disabled={review.loading}
          />
          <div className="flex gap-2">
            <button
              onClick={submitReview}
              disabled={review.loading}
              className={review.action === 'approve' ? 'btn-success' : 'btn-danger'}
            >
              {review.loading ? 'Processing…' : `Confirm ${review.action === 'approve' ? 'Approval' : 'Rejection'}`}
            </button>
            <button onClick={cancelReview} className="btn-secondary" disabled={review.loading}>
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
                <th className="table-th">User</th>
                <th className="table-th hidden md:table-cell">Country</th>
                <th className="table-th hidden md:table-cell">ID Type</th>
                <th className="table-th hidden lg:table-cell">Documents</th>
                <th className="table-th hidden lg:table-cell">Submitted</th>
                <th className="table-th">Status</th>
                <th className="table-th hidden xl:table-cell">Note</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="table-td">
                        <div className="skeleton h-4 w-full max-w-[80px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">🪪</div>
                    <p className="font-medium">No KYC records</p>
                    <p className="text-sm">No submissions match the current filter</p>
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="table-row">
                    <td className="table-td font-mono text-xs text-gray-400">#{rec.id}</td>
                    <td className="table-td">
                      <p className="font-medium text-gray-800 text-sm">{rec.user_name || '—'}</p>
                      <p className="text-xs text-gray-400">{rec.user_email}</p>
                    </td>
                    <td className="table-td hidden md:table-cell text-gray-600 text-sm">{rec.country || '—'}</td>
                    <td className="table-td hidden md:table-cell">
                      <span className="text-xs font-medium text-gray-600 uppercase bg-gray-100 px-2 py-0.5 rounded">
                        {rec.id_type || '—'}
                      </span>
                    </td>
                    <td className="table-td hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {rec.selfie_path && (
                          <a
                            href={rec.selfie_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline block"
                            title={rec.selfie_path}
                          >
                            📸 Selfie
                          </a>
                        )}
                        {rec.id_front_path && (
                          <a
                            href={rec.id_front_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline block"
                            title={rec.id_front_path}
                          >
                            🪪 ID Front
                          </a>
                        )}
                        {rec.id_back_path && (
                          <a
                            href={rec.id_back_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline block"
                            title={rec.id_back_path}
                          >
                            🪪 ID Back
                          </a>
                        )}
                        {!rec.selfie_path && !rec.id_front_path && !rec.id_back_path && (
                          <span className="text-xs text-gray-400">No files</span>
                        )}
                      </div>
                    </td>
                    <td className="table-td hidden lg:table-cell text-xs text-gray-500">
                      {rec.submitted_at ? new Date(rec.submitted_at).toLocaleDateString() : '—'}
                      {rec.reviewed_at && (
                        <p className="text-xs text-gray-400">
                          Reviewed: {new Date(rec.reviewed_at).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="table-td">
                      <Badge label={rec.status} variant={statusVariant(rec.status)} />
                    </td>
                    <td className="table-td hidden xl:table-cell text-xs text-gray-500 max-w-[160px]">
                      {rec.review_note ? (
                        <span title={rec.review_note}>
                          {rec.review_note.slice(0, 50)}{rec.review_note.length > 50 ? '…' : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="table-td">
                      {rec.status === 'pending' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startReview(rec.id, 'approve')}
                            disabled={review?.id === rec.id}
                            className="btn-success text-xs px-2.5 py-1"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => startReview(rec.id, 'reject')}
                            disabled={review?.id === rec.id}
                            className="btn-danger text-xs px-2.5 py-1"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && records.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            {records.length} record{records.length !== 1 ? 's' : ''}
            {filter !== 'all' ? ` (filtered: ${filter})` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
