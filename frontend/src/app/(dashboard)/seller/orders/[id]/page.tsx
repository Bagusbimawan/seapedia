'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { sellerOrderById } from '@/lib/api/orders'
import { formatRupiah, formatDate } from '@/lib/format'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { SELLER_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

interface Props { params: Promise<{ id: string }> }

export default function SellerOrderDetailPage({ params }: Props) {
  const { id } = use(params)
  const orderKey = useScopedQueryKey('seller-order', id)
  const { data: order, isLoading } = useQuery({
    queryKey: orderKey,
    queryFn: async () => (await sellerOrderById(id)).data.data,
  })

  return (
    <DashboardLayout title="Detail Pesanan" navItems={SELLER_NAV} role="SELLER">
      <Link href="/seller/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ocean-600 hover:text-ocean-700">← Kembali</Link>
      {isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      ) : !order ? (
        <Card><p className="text-sm text-slate-500">Pesanan tidak ditemukan.</p></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Pesanan #{id.slice(0, 8)}</CardTitle></CardHeader>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span>Status</span><OrderStatusBadge status={order.status as OrderStatus} /></div>
            <div className="flex justify-between"><span>Total</span><span className="font-bold">{formatRupiah(order.total)}</span></div>
            <div className="flex justify-between"><span>Tanggal</span><span>{formatDate(order.created_at)}</span></div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Items:</p>
            {order.items?.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="flex justify-between text-sm">
                <span>{item.name_snapshot} × {item.quantity}</span>
                <span>{formatRupiah(item.price_snapshot * item.quantity)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}
