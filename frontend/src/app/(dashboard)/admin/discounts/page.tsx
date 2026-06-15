'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { adminCreateVoucher, adminCreatePromo } from '@/lib/api/discounts'
import { advanceDay } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { ADMIN_NAV } from '@/lib/nav'
import type { DiscountType } from '@/types'

function toExpiryISO(date: string): string {
  return date
}

export default function AdminDiscountsPage() {
  const vouchers = useAdminStore((s) => s.vouchers)
  const promos = useAdminStore((s) => s.promos)
  const fetchVouchers = useAdminStore((s) => s.fetchVouchers)
  const fetchPromos = useAdminStore((s) => s.fetchPromos)

  const [tab, setTab] = useState<'voucher' | 'promo'>('voucher')
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT')
  const [value, setValue] = useState(20)
  const [expiryDate, setExpiryDate] = useState('2026-12-31')
  const [usage, setUsage] = useState(100)
  const [loading, setLoading] = useState(false)
  const [clockLoading, setClockLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clockMsg, setClockMsg] = useState<string | null>(null)

  useFetchOnAuth(() => {
    void fetchVouchers()
    void fetchPromos()
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const expiry = toExpiryISO(expiryDate)
      if (tab === 'voucher') {
        await adminCreateVoucher({ code, discount_type: discountType, discount_value: value, expiry_date: expiry, remaining_usage: usage })
        await fetchVouchers()
      } else {
        await adminCreatePromo({ code, discount_type: discountType, discount_value: value, expiry_date: expiry })
        await fetchPromos()
      }
      setCode('')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal membuat diskon')
    } finally { setLoading(false) }
  }

  const handleAdvanceDay = async () => {
    setClockLoading(true)
    setClockMsg(null)
    try {
      const res = await advanceDay()
      setClockMsg(`Virtual clock offset: ${res.data.data?.offset_hours ?? 0} jam`)
    } catch (err: unknown) {
      setClockMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal advance day')
    } finally { setClockLoading(false) }
  }

  return (
    <DashboardLayout title="Diskon & Sistem" navItems={ADMIN_NAV} role="ADMIN">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Buat Diskon</CardTitle></CardHeader>
          <div className="mb-3 flex gap-2">
            <Button size="sm" variant={tab === 'voucher' ? 'primary' : 'secondary'} onClick={() => setTab('voucher')}>Voucher</Button>
            <Button size="sm" variant={tab === 'promo' ? 'primary' : 'secondary'} onClick={() => setTab('promo')}>Promo</Button>
          </div>
          <div className="flex flex-col gap-3">
            <Input label="Kode" value={code} onChange={(e) => setCode(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" variant={discountType === 'PERCENT' ? 'primary' : 'secondary'} onClick={() => setDiscountType('PERCENT')}>%</Button>
              <Button size="sm" variant={discountType === 'FIXED' ? 'primary' : 'secondary'} onClick={() => setDiscountType('FIXED')}>Fixed</Button>
            </div>
            <Input label="Nilai" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            <Input label="Tanggal Kedaluwarsa" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            {tab === 'voucher' && <Input label="Sisa Penggunaan" type="number" value={usage} onChange={(e) => setUsage(Number(e.target.value))} />}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleCreate} isLoading={loading}>Buat {tab === 'voucher' ? 'Voucher' : 'Promo'}</Button>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Virtual Clock</CardTitle></CardHeader>
          <p className="mb-3 text-sm text-slate-500">Advance virtual clock +1 hari dan trigger overdue processing.</p>
          <Button onClick={handleAdvanceDay} isLoading={clockLoading}>Advance Day (+24h)</Button>
          {clockMsg && <p className="mt-2 text-sm text-ocean-600">{clockMsg}</p>}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Vouchers</CardTitle></CardHeader>
          {vouchers?.items?.map((d) => (
            <div key={d.id} className="mb-2 flex items-center justify-between text-sm">
              <span className="font-mono font-medium">{d.code}</span>
              <Badge>{d.discount_type} {d.discount_value}{d.discount_type === 'PERCENT' ? '%' : ''}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <CardHeader><CardTitle>Promos</CardTitle></CardHeader>
          {promos?.items?.map((d) => (
            <div key={d.id} className="mb-2 flex items-center justify-between text-sm">
              <span className="font-mono font-medium">{d.code}</span>
              <span className="text-xs text-slate-400">{formatDate(d.expiry_date)}</span>
            </div>
          ))}
        </Card>
      </div>
    </DashboardLayout>
  )
}
