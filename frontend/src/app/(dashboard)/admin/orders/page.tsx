'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatRupiah, formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { ADMIN_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

export default function AdminOrdersPage() {
  const orders = useAdminStore((s) => s.orders)
  const ordersLoading = useAdminStore((s) => s.ordersLoading)
  const fetchOrders = useAdminStore((s) => s.fetchOrders)

  useFetchOnAuth(() => {
    void fetchOrders({ limit: 50 })
  }, [])

  return (
    <DashboardLayout title="Pesanan" navItems={ADMIN_NAV} role="ADMIN">
      {ordersLoading && !orders ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !orders?.items?.length ? (
        <Card><p className="text-sm text-slate-500">Belum ada pesanan.</p></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.items.map((order) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{formatRupiah(order.total)}</p>
                  <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                </div>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
