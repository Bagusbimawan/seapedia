'use client'

import Link from 'next/link'
import { ShoppingCart, Store, Truck, Fish, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRoleSwitch } from '@/hooks/useRoleSwitch'
import type { Role } from '@/types'

interface RoleOption {
  role: Exclude<Role, 'ADMIN' | 'PENDING'>
  label: string
  description: string
  icon: React.ReactNode
  accent: string
  border: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'BUYER',
    label: 'Pembeli',
    description: 'Belanja produk laut segar dari berbagai penjual.',
    icon: <ShoppingCart className="h-7 w-7" />,
    accent: 'bg-emerald-500/10 text-emerald-600',
    border: 'hover:border-emerald-400 hover:shadow-emerald-100',
  },
  {
    role: 'SELLER',
    label: 'Penjual',
    description: 'Kelola toko dan jual produk laut Anda.',
    icon: <Store className="h-7 w-7" />,
    accent: 'bg-amber-500/10 text-amber-600',
    border: 'hover:border-amber-400 hover:shadow-amber-100',
  },
  {
    role: 'DRIVER',
    label: 'Driver',
    description: 'Ambil dan antarkan pesanan ke pelanggan.',
    icon: <Truck className="h-7 w-7" />,
    accent: 'bg-violet-500/10 text-violet-600',
    border: 'hover:border-violet-400 hover:shadow-violet-100',
  },
]

export default function RoleSelectPage() {
  const { user } = useAuthStore()
  const { switchToRole, loading, error } = useRoleSwitch()

  const handleSelectRole = async (role: Exclude<Role, 'ADMIN' | 'PENDING'>) => {
    await switchToRole(role)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-gradient shadow-lg shadow-ocean-600/20">
            <Fish className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Pilih Peran Anda</h1>
          <p className="mt-2 text-sm text-slate-500">
            {user?.username ? `Halo, ${user.username}!` : 'Halo!'} Pilih peran untuk memulai.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {ROLE_OPTIONS.map(({ role, label, description, icon, accent, border }) => {
            const hasRole = user?.roles?.includes(role)
            if (!hasRole) return null

            return (
              <button
                key={role}
                onClick={() => handleSelectRole(role)}
                disabled={loading !== null}
                className={`group flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card ${border} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${accent}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                </div>
                {loading === role ? (
                  <svg className="h-5 w-5 animate-spin text-ocean-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-ocean-600" />
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {user?.roles && !ROLE_OPTIONS.some(({ role }) => user.roles.includes(role)) && (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Akun Anda tidak memiliki peran yang tersedia. Hubungi admin.
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-ocean-600 hover:text-ocean-700">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  )
}
