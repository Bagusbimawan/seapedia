'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Package, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { OrderListItem, LoadingSkeleton } from '@/components/ui/ListHelpers'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { buyerOrders } from '@/lib/api/orders'
import { formatRupiah, formatDate } from '@/lib/format'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { useAuth } from '@/hooks/useAuth'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { BUYER_NAV } from '@/lib/nav'
import type { OrderStatus, PaginatedData, Order } from '@/types'

export default function BuyerOrdersPage() {
  const { isReady } = useAuth()
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const ordersKey = useScopedQueryKey('buyer-orders', page)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ordersKey,
    queryFn: async () => (await buyerOrders({ page, limit: 10 })).data.data as PaginatedData<Order> | undefined,
    enabled: isReady,
    ...cachedQueryOptions,
    placeholderData: (previous: PaginatedData<Order> | undefined) => previous,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const showSkeleton = !isReady || (isLoading && !data)

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
      ) : !data?.items?.length ? (
        <EmptyState
          icon={Package}
          title="Belum ada pesanan"
          description="Pesanan Anda akan muncul di sini setelah checkout"
          action={<Link href="/products"><Button variant="primary">Mulai Belanja</Button></Link>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((order) => (
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
          {data.total > 10 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Sebelumnya</Button>
              <span className="text-sm text-slate-500">Halaman {page}</span>
              <Button size="sm" variant="secondary" disabled={page * 10 >= data.total} onClick={() => setPage((p) => p + 1)}>Selanjutnya</Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
