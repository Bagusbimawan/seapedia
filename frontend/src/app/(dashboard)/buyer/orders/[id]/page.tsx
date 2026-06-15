'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { LoadingSkeleton, SummaryRow } from '@/components/ui/ListHelpers'
import { buyerOrderById } from '@/lib/api/orders'
import { formatRupiah, formatDate } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { BUYER_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

interface Props { params: Promise<{ id: string }> }

export default function BuyerOrderDetailPage({ params }: Props) {
  const { id } = use(params)
  const { isReady } = useAuth()
  const orderKey = useScopedQueryKey('buyer-order', id)

  const { data: order, isLoading } = useQuery({
    queryKey: orderKey,
    queryFn: async () => (await buyerOrderById(id)).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  return (
    <DashboardLayout title="Detail Pesanan" navItems={BUYER_NAV} role="BUYER">
      <Link href="/buyer/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ocean-600 hover:text-ocean-700">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Pesanan
      </Link>
      {isLoading ? (
        <LoadingSkeleton rows={2} />
      ) : !order ? (
        <Card><p className="text-sm text-slate-500">Pesanan tidak ditemukan.</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Info Pesanan</CardTitle></CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Status</span>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </div>
              <SummaryRow label="Pengiriman" value={order.delivery_method} />
              <SummaryRow label="Deadline" value={formatDate(order.deadline_at)} />
              <div className="divider" />
              <SummaryRow label="Subtotal" value={formatRupiah(order.subtotal)} />
              <SummaryRow label="Diskon" value={`-${formatRupiah(order.discount_amount)}`} />
              <SummaryRow label="PPN" value={formatRupiah(order.tax_amount)} />
              <SummaryRow label="Ongkir" value={formatRupiah(order.delivery_fee)} />
              <div className="divider" />
              <SummaryRow label="Total" value={formatRupiah(order.total)} bold highlight />
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Item Pesanan</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              {order.items?.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="text-slate-700">{item.name_snapshot} × {item.quantity}</span>
                  <span className="font-medium text-slate-900">{formatRupiah(item.price_snapshot * item.quantity)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
