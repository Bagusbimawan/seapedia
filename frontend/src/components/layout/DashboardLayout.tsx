'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Fish, LogOut, ChevronRight } from 'lucide-react'
import { clearSession } from '@/lib/authSession'
import { useAuth } from '@/hooks/useAuth'
import { RoleBadge } from '@/components/ui/Badge'
import RoleSwitcher from '@/components/auth/RoleSwitcher'
import Button from '@/components/ui/Button'
import type { Role } from '@/types'
import type { NavItem } from '@/lib/nav'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  navItems: NavItem[]
  role: Role
}

const roleAccent: Record<string, string> = {
  BUYER: 'from-emerald-600 to-teal-700',
  SELLER: 'from-amber-500 to-orange-600',
  DRIVER: 'from-violet-600 to-purple-700',
  ADMIN: 'from-rose-600 to-red-700',
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  navItems,
  role,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const handleLogout = () => {
    clearSession()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== `/${role.toLowerCase()}` && pathname.startsWith(href + '/'))

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden w-72 flex-shrink-0 flex-col bg-ocean-gradient lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <Fish className="h-5 w-5 text-white" />
          </div>
          <div>
            <Link href="/" className="text-lg font-bold text-white">Seapedia</Link>
            <p className="text-[10px] uppercase tracking-widest text-ocean-300">{role} Panel</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx('sidebar-link', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <div className={clsx('flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white', roleAccent[role] ?? 'from-ocean-400 to-ocean-600')}>
                {user?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user?.username}</p>
                <RoleBadge role={role} />
              </div>
            </div>
          </div>
          <RoleSwitcher currentRole={role} />
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-ocean-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2 font-bold text-ocean-700">
              <Fish className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Seapedia</span>
            </Link>
            <div className="flex flex-shrink-0 items-center gap-2">
              <RoleBadge role={role} />
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="px-4 pb-2">
            <RoleSwitcher currentRole={role} variant="compact" />
          </div>
          <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                  isActive(item.href) ? 'bg-ocean-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {/* Page header desktop */}
        <div className="hidden border-b border-slate-200 bg-white px-8 py-6 lg:block">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="lg:hidden mb-4">
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
