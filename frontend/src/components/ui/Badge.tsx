import clsx from 'clsx'
import type { OrderStatus, Role } from '@/types'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

const orderStatusVariant: Record<OrderStatus, BadgeVariant> = {
  SEDANG_DIKEMAS: 'warning',
  MENUNGGU_PENGIRIM: 'info',
  SEDANG_DIKIRIM: 'purple',
  PESANAN_SELESAI: 'success',
  DIKEMBALIKAN: 'danger',
}

const orderStatusLabel: Record<OrderStatus, string> = {
  SEDANG_DIKEMAS: 'Sedang Dikemas',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  SEDANG_DIKIRIM: 'Sedang Dikirim',
  PESANAN_SELESAI: 'Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
}

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant={orderStatusVariant[status]} className={className}>
      {orderStatusLabel[status]}
    </Badge>
  )
}

const roleVariant: Record<Role, BadgeVariant> = {
  ADMIN: 'danger',
  SELLER: 'warning',
  BUYER: 'success',
  DRIVER: 'purple',
  PENDING: 'default',
}

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge variant={roleVariant[role]} className={className}>
      {role}
    </Badge>
  )
}
