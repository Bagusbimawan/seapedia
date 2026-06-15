'use client'

import { useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { adminCreateSeller } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { ADMIN_NAV } from '@/lib/nav'
import type { Store } from '@/types'

function provisionLabel(by?: string) {
  if (by === 'admin') return { label: 'Admin', variant: 'info' as const }
  if (by === 'seed') return { label: 'Seed', variant: 'success' as const }
  return { label: 'Seller', variant: 'default' as const }
}

export default function AdminStoresPage() {
  const stores = useAdminStore((s) => s.stores)
  const storesLoading = useAdminStore((s) => s.storesLoading)
  const fetchStores = useAdminStore((s) => s.fetchStores)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useFetchOnAuth(() => {
    void fetchStores({ limit: 50 })
  }, [])

  const { adminStores, otherStores } = useMemo(() => {
    const items = stores?.items ?? []
    return {
      adminStores: items.filter((s) => s.provisioned_by === 'admin' || s.provisioned_by === 'seed'),
      otherStores: items.filter((s) => s.provisioned_by !== 'admin' && s.provisioned_by !== 'seed'),
    }
  }, [stores?.items])

  const handleCreate = async () => {
    if (!username.trim() || !email.trim() || !password || !storeName.trim()) {
      setError('Lengkapi username, email, password, dan nama toko')
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await adminCreateSeller({
        username: username.trim(),
        email: email.trim(),
        password,
        store_name: storeName.trim(),
        description: description.trim(),
      })
      const created = res.data.data
      await fetchStores({ limit: 50 })

      setSuccess(
        `Seller dibuat! ${created?.user.email} / ${created?.demo_password} — sudah muncul di panel login`
      )
      setUsername('')
      setEmail('')
      setPassword('')
      setStoreName('')
      setDescription('')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal membuat seller')
    } finally {
      setLoading(false)
    }
  }

  const renderStore = (s: Store) => {
    const badge = provisionLabel(s.provisioned_by)
    return (
      <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-900">{s.name}</p>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <p className="text-sm text-slate-500">{s.description || '—'}</p>
        <p className="mt-1 text-xs text-slate-400">{formatDate(s.created_at)}</p>
      </div>
    )
  }

  return (
    <DashboardLayout title="Toko & Seller" navItems={ADMIN_NAV} role="ADMIN">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Buat Seller Baru</CardTitle></CardHeader>
          <p className="mb-4 text-sm text-slate-500">
            Seller baru otomatis muncul di panel login. Seed seller (seller@) juga tampil di panel login.
          </p>
          <div className="flex flex-col gap-3">
            <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Nama Toko" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            <Input label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <Button onClick={handleCreate} isLoading={loading}>Buat Seller</Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Toko di Panel Login</CardTitle></CardHeader>
            <p className="mb-3 text-xs text-slate-400">Seed seller@ + seller yang dibuat admin.</p>
            {storesLoading && !stores ? (
              <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            ) : adminStores.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada — buat seller baru di form kiri.</p>
            ) : (
              <div className="flex flex-col gap-3">{adminStores.map(renderStore)}</div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Toko Lainnya</CardTitle></CardHeader>
            <p className="mb-3 text-xs text-slate-400">Tidak muncul di panel login demo.</p>
            {otherStores.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada.</p>
            ) : (
              <div className="flex flex-col gap-3">{otherStores.map(renderStore)}</div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
