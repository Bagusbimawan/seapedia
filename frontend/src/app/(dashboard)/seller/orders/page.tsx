'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Package } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { OrderListItem, LoadingSkeleton } from '@/components/ui/ListHelpers'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { markReady } from '@/lib/api/orders'
import { getApiError } from '@/lib/apiError'
import { formatRupiah, formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useSellerStore } from '@/stores/useSellerStore'
import { SELLER_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

export default function SellerOrdersPage() {
  const [page] = useState(1)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const orders = useSellerStore((s) => s.orders)
  const ordersLoading = useSellerStore((s) => s.ordersLoading)
  const fetchOrders = useSellerStore((s) => s.fetchOrders)

  useFetchOnAuth(() => {
    void fetchOrders({ page, limit: 10 })
  }, [page])

  const handleReady = async (id: string) => {
    setLoadingId(id)
    setError(null)
    setSuccess(null)
    try {
      await markReady(id)
      await fetchOrders({ page, limit: 10 })
      setSuccess('Pesanan siap diantar! Driver dapat mengambil pekerjaan ini di panel Driver.')
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      setError(getApiError(err, 'Gagal menandai pesanan siap kirim.'))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <DashboardLayout title="Pesanan Masuk" subtitle="Kelola dan proses pesanan pelanggan" navItems={SELLER_NAV} role="SELLER">
      {success && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}
      {ordersLoading && !orders ? (
        <LoadingSkeleton rows={4} />
      ) : !orders?.items?.length ? (
        <EmptyState icon={Package} title="Belum ada pesanan" description="Pesanan dari pembeli akan muncul di sini" />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.items.map((order) => (
            <OrderListItem
              key={order.id}
              id={order.id}
              total={formatRupiah(order.total)}
              date={formatDate(order.created_at)}
              status={<OrderStatusBadge status={order.status as OrderStatus} />}
              action={
                <div className="flex items-center gap-2">
                  <Link href={`/seller/orders/${order.id}`}><Button size="sm" variant="secondary">Detail</Button></Link>
                  {order.status === 'SEDANG_DIKEMAS' && (
                    <Button size="sm" onClick={() => handleReady(order.id)} isLoading={loadingId === order.id}>Siap Kirim</Button>
                  )}
                  {order.status === 'MENUNGGU_PENGIRIM' && (
                    <span className="text-xs font-medium text-emerald-700">Menunggu driver</span>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
