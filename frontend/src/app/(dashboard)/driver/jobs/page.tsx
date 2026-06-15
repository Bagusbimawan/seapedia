'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Truck, Info, AlertCircle, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/ListHelpers'
import { listAvailableJobs, takeJob } from '@/lib/api/delivery'
import { getApiError } from '@/lib/apiError'
import { formatRupiah, formatDate } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { DRIVER_NAV } from '@/lib/nav'

export default function DriverJobsPage() {
  const queryClient = useQueryClient()
  const { isReady } = useAuth()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const availableJobsKey = useScopedQueryKey('driver-available-jobs')

  const { data, isLoading, refetch } = useQuery({
    queryKey: availableJobsKey,
    queryFn: async () => (await listAvailableJobs({ limit: 20 })).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const handleTake = async (id: string) => {
    setLoadingId(id)
    setError(null)
    try {
      await takeJob(id)
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('driver-available-jobs') })
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('driver-history') })
    } catch (err: unknown) {
      setError(getApiError(err, 'Gagal mengambil pekerjaan. Pastikan seller sudah menandai pesanan sebagai Siap Kirim.'))
    } finally { setLoadingId(null) }
  }

  return (
    <DashboardLayout title="Pekerjaan Tersedia" subtitle="Ambil pekerjaan pengiriman yang sudah siap" navItems={DRIVER_NAV} role="DRIVER">
      <div className="mb-4 flex justify-end">
        <Button size="sm" variant="secondary" onClick={handleRefresh} isLoading={refreshing}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <div className="mb-4 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Alur Driver</p>
          <p className="mt-1 text-blue-700">
            Driver bisa mengambil pekerjaan dari <strong>semua toko</strong>.
            Pekerjaan muncul setelah seller menekan <strong>Siap Kirim</strong> — klik <strong>Refresh</strong> untuk cek pekerjaan baru.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : !data?.items?.length ? (
        <EmptyState
          icon={Truck}
          title="Belum ada pekerjaan tersedia"
          description="Klik Refresh setelah seller menandai pesanan sebagai Siap Kirim."
          action={<Button variant="primary" onClick={handleRefresh} isLoading={refreshing}>Refresh</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.items.map((job) => (
            <Card key={job.id} className="transition-all hover:shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs text-slate-400">Order: {job.order_id.slice(0, 8)}...</p>
                  {job.store_name && (
                    <p className="mt-1 text-sm font-semibold text-slate-800">{job.store_name}</p>
                  )}
                  <p className="mt-1 text-lg font-bold text-emerald-600">+{formatRupiah(job.earning_amount)}</p>
                  <p className="text-xs text-slate-400">{formatDate(job.created_at)}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-700">Siap diambil — seller sudah selesai mengemas</p>
                </div>
                <Button onClick={() => handleTake(job.id)} isLoading={loadingId === job.id}>Ambil</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
