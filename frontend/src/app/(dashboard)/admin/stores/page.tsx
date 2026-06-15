'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { listStores, adminCreateSeller } from '@/lib/api/admin'
import { formatDate } from '@/lib/format'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { ADMIN_NAV } from '@/lib/nav'

export default function AdminStoresPage() {
  const queryClient = useQueryClient()
  const storesKey = useScopedQueryKey('admin-stores-list')

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: storesKey,
    queryFn: async () => (await listStores({ limit: 50 })).data.data,
  })

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
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('admin-stores-list') })
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('admin-stores') })
      queryClient.invalidateQueries({ queryKey: ['demo-sellers'] })

      setSuccess(
        `Seller dibuat: ${created?.user.email} / ${created?.demo_password} — muncul di panel login`
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

  return (
    <DashboardLayout title="Toko & Seller" navItems={ADMIN_NAV} role="ADMIN">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Buat Seller Baru</CardTitle></CardHeader>
          <p className="mb-4 text-sm text-slate-500">
            Buat akun seller + toko sekaligus. Seller akan muncul otomatis di panel login demo.
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
                  <p className="mt-1 text-xs text-slate-400">{formatDate(s.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
