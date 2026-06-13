import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import Card from './Card'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'ocean'
  href?: string
  sub?: string
}

const colorMap = {
  green: { bg: 'bg-emerald-500/10', icon: 'text-emerald-600', ring: 'ring-emerald-500/20' },
  blue: { bg: 'bg-blue-500/10', icon: 'text-blue-600', ring: 'ring-blue-500/20' },
  purple: { bg: 'bg-violet-500/10', icon: 'text-violet-600', ring: 'ring-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-600', ring: 'ring-amber-500/20' },
  ocean: { bg: 'bg-ocean-500/10', icon: 'text-ocean-600', ring: 'ring-ocean-500/20' },
}

export default function StatCard({ label, value, icon: Icon, color = 'ocean', sub }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card className="group transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-ocean-600 font-medium">{sub}</p>}
        </div>
        <div className={clsx('rounded-xl p-3 ring-1', c.bg, c.ring)}>
          <Icon className={clsx('h-5 w-5', c.icon)} />
        </div>
      </div>
    </Card>
  )
}
