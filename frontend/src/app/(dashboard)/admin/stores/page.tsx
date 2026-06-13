'use client'

import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import { listStores } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { ADMIN_NAV } from '@/lib/nav'

export default function AdminStoresPage() {
  const storesKey = useScopedQueryKey('admin-stores-list')

  const { data, isLoading } = useQuery({
    queryKey: storesKey,
    queryFn: async () => (await listStores({ limit: 50 })).data.data,
  })

  return (
    <DashboardLayout title="Toko" navItems={ADMIN_NAV} role="ADMIN">
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !data?.items?.length ? (
        <Card><p className="text-sm text-slate-500">Belum ada toko.</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.items.map((s) => (
            <Card key={s.id}>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-slate-500">{s.description}</p>
              <p className="mt-1 text-xs text-slate-400">{formatDate(s.created_at)}</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
