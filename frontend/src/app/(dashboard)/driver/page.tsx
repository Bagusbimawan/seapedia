'use client'

import Link from 'next/link'
import { Truck, History } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useDriverStore } from '@/stores/useDriverStore'
import { DRIVER_NAV } from '@/lib/nav'

export default function DriverDashboardPage() {
  const jobs = useDriverStore((s) => s.jobs)
  const fetchJobs = useDriverStore((s) => s.fetchJobs)

  useFetchOnAuth(() => {
    void fetchJobs({ limit: 1 })
  }, [])

  return (
    <DashboardLayout title="Dashboard Driver" subtitle="Kelola pekerjaan pengiriman" navItems={DRIVER_NAV} role="DRIVER">
      <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
        <p className="font-semibold">Cara kerja driver</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-violet-700">
          <li>Buyer checkout → Seller kemas pesanan</li>
          <li>Seller tekan <strong>Siap Kirim</strong> → pekerjaan muncul di halaman Pekerjaan</li>
          <li>Driver ambil pekerjaan → antar → tekan Selesaikan</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Pekerjaan Tersedia"
          value={jobs?.total ?? 0}
          icon={Truck}
          color="purple"
          sub="Siap diambil"
        />
        <StatCard
          label="Riwayat Pengiriman"
          value="→"
          icon={History}
          color="ocean"
          sub="Lihat semua"
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/driver/jobs"><Button variant="primary">Lihat Pekerjaan</Button></Link>
        <Link href="/driver/history"><Button variant="secondary">Riwayat</Button></Link>
      </div>
    </DashboardLayout>
  )
}
