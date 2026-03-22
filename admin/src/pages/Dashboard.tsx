import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, AdminStats } from '../api'
import StatCard from '../components/StatCard'

function fmt(n: number, isCurrency = false): string {
  if (isCurrency) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return `$${n.toFixed(2)}`
  }
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('zuripay_admin_token') ?? ''
    getStats(token)
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview and quick actions</p>
      </div>

      {error && (
        <div className="alert-error mb-6 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon="👥"
          label="Total Users"
          value={loading ? '' : fmt(stats?.total_users ?? 0)}
          sub={loading ? '' : `${fmt(stats?.active_users ?? 0)} active`}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon="✅"
          label="Active Users"
          value={loading ? '' : fmt(stats?.active_users ?? 0)}
          sub={loading ? '' : `${fmt(stats?.verified_users ?? 0)} verified`}
          color="green"
          loading={loading}
        />
        <StatCard
          icon="🪪"
          label="Pending KYC"
          value={loading ? '' : fmt(stats?.pending_kyc ?? 0)}
          sub={loading ? '' : `${fmt(stats?.approved_kyc ?? 0)} approved`}
          color="yellow"
          loading={loading}
        />
        <StatCard
          icon="💸"
          label="Total Transfers"
          value={loading ? '' : fmt(stats?.total_transfers ?? 0)}
          sub={loading ? '' : `${fmt(stats?.transfers_today ?? 0)} today`}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon="💰"
          label="Today's Volume"
          value={loading ? '' : fmt(stats?.volume_today ?? 0, true)}
          sub={loading ? '' : `Total: ${fmt(stats?.volume_total ?? 0, true)}`}
          color="orange"
          loading={loading}
        />
        <StatCard
          icon="❌"
          label="Failed Transfers"
          value={loading ? '' : fmt(stats?.failed_transfers ?? 0)}
          sub={loading ? '' : `${fmt(stats?.cancelled_transfers ?? 0)} cancelled`}
          color="red"
          loading={loading}
        />
      </div>

      {/* Quick actions + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              to="/kyc"
              className="flex items-center gap-3 p-3 rounded-lg border border-yellow-100 bg-yellow-50 hover:bg-yellow-100 transition-colors group"
            >
              <span className="text-xl">🪪</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">Review KYC</p>
                <p className="text-xs text-yellow-600">
                  {loading ? '...' : `${stats?.pending_kyc ?? 0} pending review`}
                </p>
              </div>
              <span className="ml-auto text-yellow-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <Link
              to="/transfers"
              className="flex items-center gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group"
            >
              <span className="text-xl">💸</span>
              <div>
                <p className="text-sm font-medium text-blue-800">View Transfers</p>
                <p className="text-xs text-blue-600">
                  {loading ? '...' : `${stats?.transfers_today ?? 0} today`}
                </p>
              </div>
              <span className="ml-auto text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <Link
              to="/users"
              className="flex items-center gap-3 p-3 rounded-lg border border-green-100 bg-green-50 hover:bg-green-100 transition-colors group"
            >
              <span className="text-xl">👥</span>
              <div>
                <p className="text-sm font-medium text-green-800">Manage Users</p>
                <p className="text-xs text-green-600">
                  {loading ? '...' : `${stats?.total_users ?? 0} registered`}
                </p>
              </div>
              <span className="ml-auto text-green-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            <Link
              to="/rates"
              className="flex items-center gap-3 p-3 rounded-lg border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors group"
            >
              <span className="text-xl">💱</span>
              <div>
                <p className="text-sm font-medium text-purple-800">Manage Rates</p>
                <p className="text-xs text-purple-600">Update exchange rates</p>
              </div>
              <span className="ml-auto text-purple-400 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Platform health */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Platform Health</h3>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: 'User Activation Rate',
                  value: stats ? Math.round((stats.active_users / Math.max(stats.total_users, 1)) * 100) : 0,
                  color: 'bg-green-500',
                },
                {
                  label: 'KYC Verification Rate',
                  value: stats ? Math.round((stats.approved_kyc / Math.max(stats.total_users, 1)) * 100) : 0,
                  color: 'bg-blue-500',
                },
                {
                  label: 'Transfer Success Rate',
                  value: stats
                    ? Math.round(
                        ((stats.total_transfers - stats.failed_transfers - stats.cancelled_transfers) /
                          Math.max(stats.total_transfers, 1)) *
                          100
                      )
                    : 0,
                  color: 'bg-purple-500',
                },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{bar.label}</span>
                    <span className="font-medium">{bar.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded-full transition-all duration-700`}
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-3 mt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(stats?.total_users ?? 0)}</p>
                  <p className="text-xs text-gray-500">Total Users</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{fmt(stats?.volume_today ?? 0, true)}</p>
                  <p className="text-xs text-gray-500">Today's Volume</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{fmt(stats?.approved_kyc ?? 0)}</p>
                  <p className="text-xs text-gray-500">Verified Users</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
