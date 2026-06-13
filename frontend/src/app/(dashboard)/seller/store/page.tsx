'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { sellerGetStore, sellerCreateStore, sellerUpdateStore } from '@/lib/api/stores'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { SELLER_NAV } from '@/lib/nav'

export default function SellerStorePage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const storeKey = useScopedQueryKey('seller-store')

  const { data: store, isLoading } = useQuery({
    queryKey: storeKey,
    queryFn: async () => {
      try {
        const res = await sellerGetStore()
        return res.data.data
      } catch { return null }
    },
  })

  useEffect(() => {
    if (store) {
      setName(store.name)
      setDescription(store.description ?? '')
    }
  }, [store])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (store) {
        await sellerUpdateStore({ name, description })
      } else {
        await sellerCreateStore({ name, description })
      }
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('seller-store') })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan toko')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Toko Saya" navItems={SELLER_NAV} role="SELLER">
      <Card>
        <CardHeader><CardTitle>{store ? 'Edit Toko' : 'Buat Toko'}</CardTitle></CardHeader>
        <div className="flex max-w-lg flex-col gap-3">
          <Input label="Nama Toko" value={name} onChange={(e) => setName(e.target.value)} required />
          <div>
            <label className="text-sm font-medium text-slate-700">Deskripsi</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSubmit} isLoading={loading}>{store ? 'Simpan Perubahan' : 'Buat Toko'}</Button>
        </div>
      </Card>
    </DashboardLayout>
  )
}
