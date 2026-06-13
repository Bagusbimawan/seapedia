'use client'

import clsx from 'clsx'
import { ShoppingCart, Store, Truck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRoleSwitch } from '@/hooks/useRoleSwitch'
import type { Role } from '@/types'

const ROLE_META: Record<Exclude<Role, 'ADMIN' | 'PENDING'>, { label: string; icon: typeof ShoppingCart }> = {
  BUYER: { label: 'Pembeli', icon: ShoppingCart },
  SELLER: { label: 'Penjual', icon: Store },
  DRIVER: { label: 'Driver', icon: Truck },
}

interface RoleSwitcherProps {
  currentRole: Role
  variant?: 'sidebar' | 'compact'
}

export default function RoleSwitcher({ currentRole, variant = 'sidebar' }: RoleSwitcherProps) {
  const { user } = useAuth()
  const { switchToRole, loading } = useRoleSwitch()

  const switchableRoles = (['BUYER', 'SELLER', 'DRIVER'] as const).filter(
    (role) => user?.roles?.includes(role) && role !== currentRole
  )

  if (switchableRoles.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {switchableRoles.map((role) => {
          const { label, icon: Icon } = ROLE_META[role]
          return (
            <button
              key={role}
              type="button"
              onClick={() => switchToRole(role)}
              disabled={loading !== null}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-ocean-300 hover:bg-ocean-50 hover:text-ocean-700 disabled:opacity-60"
            >
              <Icon className="h-3 w-3" />
              {loading === role ? '...' : label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ocean-200">
        Ganti Peran
      </p>
      <div className="flex flex-col gap-1">
        {switchableRoles.map((role) => {
          const { label, icon: Icon } = ROLE_META[role]
          return (
            <button
              key={role}
              type="button"
              onClick={() => switchToRole(role)}
              disabled={loading !== null}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                loading === role
                  ? 'bg-white/20 text-white'
                  : 'text-ocean-100 hover:bg-white/15 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{loading === role ? 'Memuat...' : label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
