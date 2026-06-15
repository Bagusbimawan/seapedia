'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { RoleBadge } from '@/components/ui/Badge'
import { LoadingSkeleton } from '@/components/ui/ListHelpers'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { ADMIN_NAV } from '@/lib/nav'

export default function AdminUsersPage() {
  const users = useAdminStore((s) => s.users)
  const usersLoading = useAdminStore((s) => s.usersLoading)
  const fetchUsers = useAdminStore((s) => s.fetchUsers)

  useFetchOnAuth(() => {
    void fetchUsers({ limit: 50 })
  }, [])

  return (
    <DashboardLayout title="Pengguna" subtitle="Semua pengguna terdaftar di platform" navItems={ADMIN_NAV} role="ADMIN">
      {usersLoading && !users ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3">Username</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Roles</th></tr>
            </thead>
            <tbody>
              {users?.items?.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{u.username}</td>
                  <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3.5"><div className="flex flex-wrap gap-1">{u.roles.map((r) => <RoleBadge key={r} role={r} />)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
