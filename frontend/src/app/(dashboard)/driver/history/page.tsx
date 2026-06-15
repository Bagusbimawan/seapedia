'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { jobHistory, completeJob } from '@/lib/api/delivery'
import { getApiError } from '@/lib/apiError'
import { formatRupiah, formatDate } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { DRIVER_NAV } from '@/lib/nav'

export default function DriverHistoryPage() {
  const queryClient = useQueryClient()
  const { isReady } = useAuth()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const historyKey = useScopedQueryKey('driver-history')

  const { data, isLoading } = useQuery({
    queryKey: historyKey,
    queryFn: async () => (await jobHistory({ limit: 50 })).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  const handleComplete = async (id: string) => {
    setLoadingId(id)
    setError(null)
    try {
      await completeJob(id)
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('driver-history') })
    } catch (err: unknown) {
      setError(getApiError(err, 'Gagal menyelesaikan pengiriman. Pastikan pesanan sedang dalam status pengiriman.'))
    } finally { setLoadingId(null) }
  }

  return (
    <DashboardLayout title="Riwayat Pekerjaan" navItems={DRIVER_NAV} role="DRIVER">
      {error && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !data?.items?.length ? (
        <Card><p className="text-sm text-slate-500">Belum ada riwayat pekerjaan. Ambil pekerjaan dari halaman Pekerjaan Tersedia.</p></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((job) => (
            <Card key={job.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Order: {job.order_id.slice(0, 8)}...</p>
                  <p className="font-semibold text-slate-900">{formatRupiah(job.earning_amount)}</p>
                  <p className="text-xs text-slate-400">{job.taken_at ? formatDate(job.taken_at) : '-'}</p>
                  {job.completed_at ? (
                    <Badge variant="success">Selesai</Badge>
                  ) : (
                    <Badge variant="warning">Dalam Pengiriman</Badge>
                  )}
                </div>
                {!job.completed_at && (
                  <Button onClick={() => handleComplete(job.id)} isLoading={loadingId === job.id}>Selesaikan</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
