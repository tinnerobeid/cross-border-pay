interface BadgeProps {
  label: string
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'purple' | 'emerald'
}

const variantClasses: Record<string, string> = {
  green:   'bg-emerald-100 text-emerald-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber:   'bg-amber-100 text-amber-700',
  red:     'bg-red-100 text-red-600',
  blue:    'bg-blue-100 text-blue-700',
  slate:   'bg-slate-100 text-slate-600',
  purple:  'bg-purple-100 text-purple-700',
}

export default function Badge({ label, variant = 'slate' }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]}`}>{label}</span>
  )
}

export function statusVariant(status: string): BadgeProps['variant'] {
  const s = (status || '').toLowerCase()
  if (['approved', 'received', 'active', 'verified'].includes(s)) return 'green'
  if (['sent'].includes(s)) return 'emerald'
  if (['processing', 'initiated', 'payment_pending'].includes(s)) return 'amber'
  if (['created'].includes(s)) return 'blue'
  if (['failed', 'rejected'].includes(s)) return 'red'
  if (['cancelled', 'canceled', 'pending', 'inactive', 'unverified'].includes(s)) return 'slate'
  if (['admin'].includes(s)) return 'purple'
  return 'slate'
}

export function roleVariant(role: string): BadgeProps['variant'] {
  return role === 'admin' ? 'purple' : 'slate'
}
