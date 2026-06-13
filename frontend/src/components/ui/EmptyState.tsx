import type { LucideIcon } from 'lucide-react'
import Card from './Card'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 rounded-2xl bg-slate-100 p-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </Card>
  )
}
