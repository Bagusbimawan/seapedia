'use client'

import Link from 'next/link'
import { Users, Store, Package } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { ADMIN_NAV } from '@/lib/nav'

export default function AdminDashboardPage() {
  const users = useAdminStore((s) => s.users)
  const stores = useAdminStore((s) => s.stores)
  const orders = useAdminStore((s) => s.orders)
  const fetchUsers = useAdminStore((s) => s.fetchUsers)
  const fetchStores = useAdminStore((s) => s.fetchStores)
  const fetchOrders = useAdminStore((s) => s.fetchOrders)

  useFetchOnAuth(() => {
    void fetchUsers({ limit: 1 })
    void fetchStores({ limit: 1 })
    void fetchOrders({ limit: 1 })
  }, [])

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
