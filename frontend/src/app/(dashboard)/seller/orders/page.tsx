'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { OrderListItem, LoadingSkeleton } from '@/components/ui/ListHelpers'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { sellerOrders, markReady } from '@/lib/api/orders'
import { formatRupiah, formatDate } from '@/lib/format'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { SELLER_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

export default function SellerOrdersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const ordersKey = useScopedQueryKey('seller-orders', page)

  const { data, isLoading } = useQuery({
    queryKey: ordersKey,
    queryFn: async () => (await sellerOrders({ page, limit: 10 })).data.data,
  })

  const handleReady = async (id: string) => {
    setLoadingId(id)
    try {
      await markReady(id)
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('seller-orders') })
    } finally { setLoadingId(null) }
  }

  return (
    <DashboardLayout title="Pesanan Masuk" subtitle="Kelola dan proses pesanan pelanggan" navItems={SELLER_NAV} role="SELLER">
      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : !data?.items?.length ? (
        <EmptyState icon={Package} title="Belum ada pesanan" description="Pesanan dari pembeli akan muncul di sini" />
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((order) => (
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
                </div>
              }
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
