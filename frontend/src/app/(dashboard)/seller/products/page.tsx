'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProductImage from '@/components/ui/ProductImage'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/ListHelpers'
import { sellerCreateProduct, sellerUpdateProduct, sellerDeleteProduct } from '@/lib/api/products'
import { formatRupiah } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useSellerStore } from '@/stores/useSellerStore'
import { usePublicStore } from '@/stores/usePublicStore'
import { SELLER_NAV } from '@/lib/nav'
import type { Product } from '@/types'
import Input from '@/components/ui/Input'
import CurrencyInput from '@/components/ui/CurrencyInput'
import Modal from '@/components/ui/Modal'

const emptyForm = { name: '', description: '', price: 0, stock: 0 }

export default function SellerProductsPage() {
  const products = useSellerStore((s) => s.products)
  const productsLoading = useSellerStore((s) => s.productsLoading)
  const store = useSellerStore((s) => s.store)
  const fetchStore = useSellerStore((s) => s.fetchStore)
  const fetchProducts = useSellerStore((s) => s.fetchProducts)
  const resetPublic = usePublicStore((s) => s.reset)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useFetchOnAuth(() => {
    void fetchStore()
  }, [])

  useFetchOnAuth(() => {
    if (store) void fetchProducts({ limit: 50 })
  }, [store?.id])

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
      await fetchProducts({ limit: 50 })
      resetPublic()
      setModalOpen(false)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan produk')
    } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    await sellerDeleteProduct(id)
    await fetchProducts({ limit: 50 })
    resetPublic()
  }

  return (
    <DashboardLayout title="Produk" subtitle="Kelola katalog produk toko Anda" navItems={SELLER_NAV} role="SELLER">
      <div className="mb-4 flex justify-end"><Button onClick={openCreate}>Tambah Produk</Button></div>
      {productsLoading && !products ? (
        <LoadingSkeleton rows={3} />
      ) : !store ? (
        <EmptyState icon={Package} title="Belum ada toko" description="Buat toko dulu di menu Toko Saya" action={<Button onClick={() => window.location.href = '/seller/store'}>Ke Toko Saya</Button>} />
      ) : !products?.items?.length ? (
        <EmptyState icon={Package} title="Belum ada produk" description="Tambahkan produk pertama Anda" action={<Button onClick={openCreate}>Tambah Produk</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.items.map((p) => (
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
