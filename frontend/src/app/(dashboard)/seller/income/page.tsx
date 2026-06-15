'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatRupiah, formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useSellerStore } from '@/stores/useSellerStore'
import { SELLER_NAV } from '@/lib/nav'

export default function SellerIncomePage() {
  const income = useSellerStore((s) => s.income)
  const incomeLoading = useSellerStore((s) => s.incomeLoading)
  const fetchIncome = useSellerStore((s) => s.fetchIncome)

  useFetchOnAuth(() => {
    void fetchIncome({ limit: 50 })
  }, [])

  return (
    <DashboardLayout title="Pendapatan" subtitle="Riwayat income dan reversal" navItems={SELLER_NAV} role="SELLER">
      {incomeLoading && !income ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !income?.items?.length ? (
        <Card><p className="text-sm text-slate-500">Belum ada pendapatan.</p></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {income.items.map((inc) => (
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
