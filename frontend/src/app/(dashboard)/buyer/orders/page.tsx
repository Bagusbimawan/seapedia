'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { OrderListItem, LoadingSkeleton } from '@/components/ui/ListHelpers'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatRupiah, formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useBuyerStore } from '@/stores/useBuyerStore'
import { BUYER_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

export default function BuyerOrdersPage() {
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const orders = useBuyerStore((s) => s.orders)
  const ordersLoading = useBuyerStore((s) => s.ordersLoading)
  const ordersError = useBuyerStore((s) => s.ordersError)
  const fetchOrders = useBuyerStore((s) => s.fetchOrders)

  useFetchOnAuth(() => {
    void fetchOrders({ page, limit: 10 })
  }, [page])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchOrders({ page, limit: 10 })
    } finally {
      setRefreshing(false)
    }
  }

  const showSkeleton = ordersLoading && !orders?.items?.length

  return (
    <DashboardLayout title="Riwayat Pembelian" subtitle="Lacak semua pesanan Anda" navItems={BUYER_NAV} role="BUYER">
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="secondary" onClick={handleRefresh} isLoading={refreshing}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {showSkeleton ? (
        <LoadingSkeleton rows={4} />
      ) : ordersError ? (
        <EmptyState
          icon={Package}
          title="Gagal memuat riwayat"
          description="Silakan coba refresh atau login ulang."
          action={<Button variant="primary" onClick={handleRefresh}>Coba Lagi</Button>}
        />
      ) : !orders?.items?.length ? (
        <EmptyState
          icon={Package}
          title="Belum ada pesanan"
          description="Pesanan Anda akan muncul di sini setelah checkout"
          action={<Link href="/products"><Button variant="primary">Mulai Belanja</Button></Link>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.items.map((order) => (
              <OrderListItem
                key={order.id}
                id={order.id}
                total={formatRupiah(order.total)}
                date={formatDate(order.created_at)}
                status={<OrderStatusBadge status={order.status as OrderStatus} />}
                action={
                  <Link href={`/buyer/orders/${order.id}`}>
                    <Button size="sm" variant="secondary">Detail</Button>
                  </Link>
                }
              />
            ))}
          </div>
          {orders.total > 10 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
              <span className="text-sm text-slate-500">Halaman {page}</span>
              <Button size="sm" variant="secondary" disabled={page * 10 >= orders.total} onClick={() => setPage((p) => p + 1)}>Selanjutnya</Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
