'use client'

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { listStores, listUsers, adminCreateStore } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { ADMIN_NAV } from '@/lib/nav'

export default function AdminStoresPage() {
  const queryClient = useQueryClient()
  const storesKey = useScopedQueryKey('admin-stores-list')
  const usersKey = useScopedQueryKey('admin-users-for-store')

  const [sellerUserId, setSellerUserId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: storesKey,
    queryFn: async () => (await listStores({ limit: 50 })).data.data,
  })

  const { data: usersData } = useQuery({
    queryKey: usersKey,
    queryFn: async () => (await listUsers({ limit: 100 })).data.data,
  })

  const sellerOptions = useMemo(() => {
    const existingSellerIds = new Set(data?.items?.map((s) => s.seller_user_id) ?? [])
    return (usersData?.items ?? []).filter(
      (u) => u.roles.includes('SELLER') && !existingSellerIds.has(u.id)
    )
  }, [usersData?.items, data?.items])

  const handleCreate = async () => {
    if (!sellerUserId || !name.trim()) {
      setError('Pilih penjual dan isi nama toko')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await adminCreateStore({ seller_user_id: sellerUserId, name: name.trim(), description: description.trim() })
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('admin-stores-list') })
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('admin-stores') })
      setSellerUserId('')
      setName('')
      setDescription('')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal membuat toko')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Toko" navItems={ADMIN_NAV} role="ADMIN">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Buat Toko Baru</CardTitle></CardHeader>
          <p className="mb-4 text-sm text-slate-500">
            Pilih akun penjual yang belum punya toko, lalu isi detail toko.
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Penjual</span>
              <select
                value={sellerUserId}
                onChange={(e) => setSellerUserId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/20"
              >
                <option value="">— Pilih penjual —</option>
                {sellerOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username} ({u.email})
                  </option>
                ))}
              </select>
            </label>
            <Input label="Nama Toko" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleCreate} isLoading={loading} disabled={sellerOptions.length === 0}>
              Buat Toko
            </Button>
            {sellerOptions.length === 0 && (
              <p className="text-xs text-slate-400">Semua penjual sudah punya toko, atau belum ada akun SELLER.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Daftar Toko</CardTitle></CardHeader>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ) : !data?.items?.length ? (
            <p className="text-sm text-slate-500">Belum ada toko.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.items.map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.description || '—'}</p>
                  <p className="mt-1 text-xs text-slate-400">Seller: {s.seller_user_id.slice(0, 8)}… · {formatDate(s.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
