'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { completeJob } from '@/lib/api/delivery'
import { getApiError } from '@/lib/apiError'
import { formatRupiah, formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useDriverStore } from '@/stores/useDriverStore'
import { DRIVER_NAV } from '@/lib/nav'

export default function DriverHistoryPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const history = useDriverStore((s) => s.history)
  const historyLoading = useDriverStore((s) => s.historyLoading)
  const fetchHistory = useDriverStore((s) => s.fetchHistory)

  useFetchOnAuth(() => {
    void fetchHistory({ limit: 50 })
  }, [])

  const handleComplete = async (id: string) => {
    setLoadingId(id)
    setError(null)
    try {
      await completeJob(id)
      await fetchHistory({ limit: 50 })
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

      {historyLoading && !history ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
      ) : !history?.items?.length ? (
        <Card><p className="text-sm text-slate-500">Belum ada riwayat pekerjaan. Ambil pekerjaan dari halaman Pekerjaan Tersedia.</p></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {history.items.map((job) => (
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
