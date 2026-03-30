import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getTransfers, getKYCRecords, AdminStats, Transfer, KYCRecord, getToken } from '../api'
import StatCard from '../components/StatCard'
import Badge, { statusVariant } from '../components/Badge'

function fmt(n: number) { return n.toLocaleString() }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const token = getToken()!
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [kyc, setKyc] = useState<KYCRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getStats(token),
      getTransfers(token, { limit: 6 }),
      getKYCRecords(token, 'pending'),
    ])
      .then(([s, t, k]) => { setStats(s); setTransfers(t); setKyc(k) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{greeting()}, Admin</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
          All systems operational
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={fmt(stats?.total_users ?? 0)}
          subtitle={`${fmt(stats?.active_users ?? 0)} active`} loading={loading} color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard title="Verified Users" value={fmt(stats?.verified_users ?? 0)}
          subtitle="Identity confirmed" loading={loading} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <StatCard title="Pending KYC" value={fmt(stats?.pending_kyc ?? 0)}
          subtitle="Awaiting review" loading={loading} color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Total Transfers" value={fmt(stats?.total_transfers ?? 0)}
          subtitle={`${fmt(stats?.transfers_today ?? 0)} today`} loading={loading} color="blue"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
        />
        <StatCard title="Volume Today" value={`₩${fmt(stats?.volume_today ?? 0)}`}
          subtitle={`Total: ₩${fmt(stats?.volume_total ?? 0)}`} loading={loading} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Failed Transfers" value={fmt(stats?.failed_transfers ?? 0)}
          subtitle={`${fmt(stats?.cancelled_transfers ?? 0)} cancelled`} loading={loading} color="red"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
        <StatCard title="Fees Earned" value={`₩${(stats?.total_fees_earned ?? 0).toLocaleString()}`}
          subtitle={`₩${(stats?.fees_earned_today ?? 0).toLocaleString()} today`} loading={loading} color="green"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Review Pending KYC', to: '/kyc', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100', count: stats?.pending_kyc },
            { label: 'View All Users', to: '/users', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100', count: stats?.total_users },
            { label: 'Failed Transfers', to: '/transfers', color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100', count: stats?.failed_transfers },
            { label: 'Manage Rates', to: '/rates', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100', count: null },
          ].map(item => (
            <Link key={item.to} to={item.to} className={`card p-4 border transition flex flex-col gap-1 ${item.color}`}>
              <p className="font-semibold text-sm">{item.label}</p>
              {item.count !== undefined && item.count !== null && (
                <p className="text-xl font-bold">{fmt(item.count)}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent transfers */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Transfers</h3>
            <Link to="/transfers" className="text-blue-600 text-xs font-medium hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
          ) : transfers.length === 0 ? (
            <p className="p-6 text-center text-slate-400 text-sm">No transfers yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transfers.slice(0, 5).map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{t.recipient_name}</p>
                    <p className="text-xs text-slate-400">{fmtDate(t.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700">{t.send_currency} {t.send_amount.toLocaleString()}</p>
                    </div>
                    <Badge label={t.status} variant={statusVariant(t.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending KYC */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Pending KYC</h3>
            <Link to="/kyc" className="text-blue-600 text-xs font-medium hover:underline">Review all</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
          ) : kyc.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">All caught up!</p>
              <p className="text-slate-400 text-xs">No pending KYC submissions</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {kyc.slice(0, 5).map(k => (
                <div key={k.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{k.user_name || k.user_email}</p>
                    <p className="text-xs text-slate-400">{k.country} · {k.id_type}</p>
                  </div>
                  <Link to="/kyc" className="text-blue-600 text-xs font-medium hover:underline flex-shrink-0 ml-3">Review →</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
