'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProductImage from '@/components/ui/ProductImage'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/ListHelpers'
import { sellerListProducts, sellerCreateProduct, sellerUpdateProduct, sellerDeleteProduct } from '@/lib/api/products'
import { formatRupiah } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { SELLER_NAV } from '@/lib/nav'
import type { Product } from '@/types'
import Input from '@/components/ui/Input'
import CurrencyInput from '@/components/ui/CurrencyInput'
import Modal from '@/components/ui/Modal'

const emptyForm = { name: '', description: '', price: 0, stock: 0 }

export default function SellerProductsPage() {
  const queryClient = useQueryClient()
  const { isReady } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const productsKey = useScopedQueryKey('seller-products')

  const { data, isLoading } = useQuery({
    queryKey: productsKey,
    queryFn: async () => (await sellerListProducts({ limit: 50 })).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description ?? '', price: p.price, stock: p.stock })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (editing) await sellerUpdateProduct(editing.id, form)
      else await sellerCreateProduct(form)
      await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('seller-products') })
      setModalOpen(false)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan produk')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    await sellerDeleteProduct(id)
    await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('seller-products') })
  }

  return (
    <DashboardLayout title="Produk" subtitle="Kelola katalog produk toko Anda" navItems={SELLER_NAV} role="SELLER">
      <div className="mb-4 flex justify-end"><Button onClick={openCreate}>Tambah Produk</Button></div>
      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : !data?.items?.length ? (
        <EmptyState icon={Package} title="Belum ada produk" description="Tambahkan produk pertama Anda" action={<Button onClick={openCreate}>Tambah Produk</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <Card key={p.id} className="transition-all hover:shadow-card">
              <ProductImage name={p.name} size="sm" className="mb-3 h-32 w-full rounded-xl" />
              <p className="font-semibold text-slate-900">{p.name}</p>
              <p className="text-sm font-medium text-ocean-600">{formatRupiah(p.price)}</p>
              <p className="text-xs text-slate-400">Stok: {p.stock}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(p.id)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Produk' : 'Tambah Produk'} size="lg">
        <div className="flex flex-col gap-3">
          <Input label="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <CurrencyInput label="Harga (Rp)" value={form.price} onChange={(price) => setForm({ ...form, price })} />
          <Input label="Stok" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSubmit} isLoading={loading}>Simpan</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
