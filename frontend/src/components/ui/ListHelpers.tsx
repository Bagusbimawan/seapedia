import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

interface SelectionOptionProps {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
  trailing?: React.ReactNode
}

export function SelectionOption({ selected, onSelect, children, trailing }: SelectionOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'flex w-full cursor-pointer items-center justify-between rounded-xl border-2 p-4 text-left transition-all',
        selected
          ? 'border-ocean-500 bg-ocean-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      <div className="flex items-start gap-3">{children}</div>
      {trailing}
    </button>
  )
}

interface LoadingSkeletonProps {
  rows?: number
  className?: string
}

export function LoadingSkeleton({ rows = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  )
}

interface OrderListItemProps {
  id: string
  total: string
  date: string
  status: React.ReactNode
  action?: React.ReactNode
}

export function OrderListItem({ id, total, date, status, action }: OrderListItemProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition-all hover:shadow-card">
      <div>
        <p className="font-mono text-xs text-slate-400">{id.slice(0, 8)}...</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{total}</p>
        <p className="text-xs text-slate-500">{date}</p>
      </div>
      <div className="flex items-center gap-3">
        {status}
        {action}
      </div>
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}

export function SummaryRow({ label, value, bold, highlight }: SummaryRowProps) {
  return (
    <div className={clsx('flex justify-between text-sm', bold && 'text-base font-bold')}>
      <span className={bold ? 'text-slate-900' : 'text-slate-600'}>{label}</span>
      <span className={clsx(bold ? 'text-slate-900' : 'text-slate-700', highlight && 'text-ocean-600')}>{value}</span>
    </div>
  )
}

interface EmptyCardProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyCard({ icon: Icon, title, description, action }: EmptyCardProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12 text-center">
      <div className="mb-4 rounded-2xl bg-slate-100 p-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
