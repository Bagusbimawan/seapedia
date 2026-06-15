'use client'

import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { sellerIncome } from '@/lib/api/orders'
import { formatRupiah, formatDate } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { SELLER_NAV } from '@/lib/nav'

export default function SellerIncomePage() {
  const { isReady } = useAuth()
  const incomeKey = useScopedQueryKey('seller-income')

  const { data, isLoading } = useQuery({
    queryKey: incomeKey,
    queryFn: async () => (await sellerIncome({ limit: 50 })).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  return (
    <DashboardLayout title="Pendapatan" subtitle="Riwayat income dan reversal" navItems={SELLER_NAV} role="SELLER">
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !data?.items?.length ? (
        <Card><p className="text-sm text-slate-500">Belum ada pendapatan.</p></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {data.items.map((inc) => (
            <Card key={inc.id}>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={inc.type === 'INCOME' ? 'success' : 'danger'}>{inc.type}</Badge>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(inc.created_at)}</p>
                </div>
                <p className={`font-bold ${inc.type === 'REVERSAL' ? 'text-red-600' : 'text-green-600'}`}>
                  {inc.type === 'REVERSAL' ? '-' : '+'}{formatRupiah(inc.amount)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
