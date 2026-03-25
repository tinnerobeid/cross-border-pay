import type { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate'
  loading?: boolean
}

const colorMap: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-600',
  green:  'bg-emerald-100 text-emerald-600',
  red:    'bg-red-100 text-red-600',
  amber:  'bg-amber-100 text-amber-600',
  purple: 'bg-purple-100 text-purple-600',
  slate:  'bg-slate-100 text-slate-600',
}

export default function StatCard({ title, value, subtitle, icon, color = 'blue', loading = false }: Props) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        {loading ? (
          <>
            <div className="skeleton h-7 w-20 mb-1" />
            {subtitle && <div className="skeleton h-3 w-14 mt-1" />}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </>
        )}
      </div>
    </div>
  )
}
