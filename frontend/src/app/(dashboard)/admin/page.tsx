'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Users, Store, Package } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import { listUsers, listStores, listOrders } from '@/lib/api/admin'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { ADMIN_NAV } from '@/lib/nav'

export default function AdminDashboardPage() {
  const usersKey = useScopedQueryKey('admin-users')
  const storesKey = useScopedQueryKey('admin-stores')
  const ordersKey = useScopedQueryKey('admin-orders')

  const { data: users } = useQuery({ queryKey: usersKey, queryFn: async () => (await listUsers({ limit: 1 })).data.data })
  const { data: stores } = useQuery({ queryKey: storesKey, queryFn: async () => (await listStores({ limit: 1 })).data.data })
  const { data: orders } = useQuery({ queryKey: ordersKey, queryFn: async () => (await listOrders({ limit: 1 })).data.data })

  return (
    <DashboardLayout title="Dashboard Admin" subtitle="Monitoring platform" navItems={ADMIN_NAV} role="ADMIN">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Pengguna" value={users?.total ?? 0} icon={Users} color="ocean" />
        <StatCard label="Total Toko" value={stores?.total ?? 0} icon={Store} color="amber" />
        <StatCard label="Total Pesanan" value={orders?.total ?? 0} icon={Package} color="purple" />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/users"><Button variant="primary">Kelola Pengguna</Button></Link>
        <Link href="/admin/stores"><Button variant="secondary">Kelola Toko</Button></Link>
        <Link href="/admin/orders"><Button variant="ghost">Semua Pesanan</Button></Link>
      </div>
    </DashboardLayout>
  )
}
