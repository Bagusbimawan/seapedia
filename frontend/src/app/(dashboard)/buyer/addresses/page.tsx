'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingSkeleton } from '@/components/ui/ListHelpers'
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/lib/api/addresses'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useBuyerStore } from '@/stores/useBuyerStore'
import type { Address } from '@/types'
import { BUYER_NAV } from '@/lib/nav'

const emptyForm = { label: '', street: '', city: '', zip_code: '', is_default: false }

export default function BuyerAddressesPage() {
  const addresses = useBuyerStore((s) => s.addresses)
  const addressesLoading = useBuyerStore((s) => s.addressesLoading)
  const fetchAddresses = useBuyerStore((s) => s.fetchAddresses)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useFetchOnAuth(() => {
    void fetchAddresses()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  const openEdit = (addr: Address) => {
    setEditing(addr)
    setForm({ label: addr.label, street: addr.street, city: addr.city, zip_code: addr.zip_code, is_default: addr.is_default })
    setError(null)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (editing) {
        await updateAddress(editing.id, form)
      } else {
        await createAddress(form)
      }
      await fetchAddresses()
      setModalOpen(false)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan alamat')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus alamat ini?')) return
    await deleteAddress(id)
    await fetchAddresses()
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id)
    await fetchAddresses()
  }

  return (
    <DashboardLayout title="Alamat" subtitle="Kelola alamat pengiriman" navItems={BUYER_NAV} role="BUYER">
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>Tambah Alamat</Button>
      </div>

      {addressesLoading && addresses.length === 0 ? (
        <LoadingSkeleton rows={2} />
      ) : !addresses.length ? (
        <EmptyState
          icon={MapPin}
          title="Belum ada alamat"
          description="Tambahkan alamat untuk proses checkout"
          action={<Button onClick={openCreate}>Tambah Alamat</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id} className="transition-all hover:shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ocean-600" />
                <p className="font-semibold text-slate-900">{addr.label}</p>
                {addr.is_default && <Badge variant="success">Default</Badge>}
              </div>
              <p className="text-sm text-slate-600">{addr.street}</p>
              <p className="text-sm text-slate-500">{addr.city}, {addr.zip_code}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!addr.is_default && (
                  <Button size="sm" variant="secondary" onClick={() => handleSetDefault(addr.id)}>Jadikan Default</Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => openEdit(addr)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(addr.id)}>Hapus</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Alamat' : 'Tambah Alamat'}>
        <div className="flex flex-col gap-3">
          <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          <Input label="Jalan" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
          <Input label="Kota" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <Input label="Kode Pos" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} required />
          {!editing && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              Jadikan alamat default
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSubmit} isLoading={loading}>Simpan</Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
