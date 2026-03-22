interface BadgeProps {
  label: string
  variant?: 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple' | 'orange'
}

const variantClasses: Record<string, string> = {
  green: 'bg-green-100 text-green-700 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  red: 'bg-red-100 text-red-700 border border-red-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200',
  orange: 'bg-orange-100 text-orange-700 border border-orange-200',
}

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  )
}

// ─── Helpers to pick the right variant ───────────────────────────────────────

export function statusVariant(status: string): BadgeProps['variant'] {
  const s = status.toLowerCase()
  if (s === 'approved' || s === 'received' || s === 'sent' || s === 'success' || s === 'active') return 'green'
  if (s === 'pending' || s === 'processing' || s === 'created') return 'yellow'
  if (s === 'rejected' || s === 'failed' || s === 'cancelled' || s === 'inactive') return 'red'
  if (s === 'admin') return 'purple'
  return 'gray'
}

export function roleVariant(role: string): BadgeProps['variant'] {
  if (role === 'admin') return 'purple'
  return 'gray'
}
