interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange'
  loading?: boolean
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
}

export default function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'blue',
  loading = false,
}: StatCardProps) {
  return (
    <div className="stat-card flex items-start gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <div className="skeleton h-7 w-24 mb-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        )}
        {loading && sub && <div className="skeleton h-3 w-16 mt-2" />}
      </div>
    </div>
  )
}
