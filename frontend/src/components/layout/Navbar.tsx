'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Fish, Menu, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { logoutAndRedirect } from '@/lib/authSession'
import { useAuth } from '@/hooks/useAuth'
import { RoleBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Role } from '@/types'

const dashboardLinks: Record<Exclude<Role, 'PENDING'>, { href: string; label: string }> = {
  BUYER: { href: '/buyer', label: 'Dashboard' },
  SELLER: { href: '/seller', label: 'Dashboard' },
  DRIVER: { href: '/driver', label: 'Dashboard' },
  ADMIN: { href: '/admin', label: 'Dashboard' },
}

export default function Navbar() {
  const { isAuthenticated, user, activeRole } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logoutAndRedirect()
  }

  const dashboardLink =
    activeRole && activeRole !== 'PENDING'
      ? dashboardLinks[activeRole as Exclude<Role, 'PENDING'>]
      : null

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ocean-gradient">
              <Fish className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Seapedia</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {[
              { href: '/products', label: 'Produk' },
              { href: '/reviews', label: 'Ulasan' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && dashboardLink && (
              <Link
                href={dashboardLink.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ocean-700 transition-colors hover:bg-ocean-50"
              >
                {dashboardLink.label}
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean-600 text-xs font-bold text-white">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user?.username}</span>
                  {activeRole && <RoleBadge role={activeRole} />}
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm">Masuk</Button></Link>
                <Link href="/register"><Button variant="primary" size="sm">Daftar</Button></Link>
              </>
            )}
          </div>

          <button
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className={clsx('border-t border-slate-100 bg-white md:hidden', mobileOpen ? 'block' : 'hidden')}>
        <div className="flex flex-col gap-1 px-4 py-3">
          <Link href="/products" className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Produk</Link>
          <Link href="/reviews" className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Ulasan</Link>
          {isAuthenticated && dashboardLink && (
            <Link href={dashboardLink.href} className="rounded-xl px-3 py-2.5 text-sm font-medium text-ocean-700 hover:bg-ocean-50" onClick={() => setMobileOpen(false)}>{dashboardLink.label}</Link>
          )}
          <div className="mt-2 border-t border-slate-100 pt-2">
            {isAuthenticated ? (
              <button onClick={() => { setMobileOpen(false); handleLogout() }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="rounded-xl px-3 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMobileOpen(false)}>Masuk</Link>
                <Link href="/register" className="rounded-xl bg-ocean-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-ocean-700" onClick={() => setMobileOpen(false)}>Daftar</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
