'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProductImage from '@/components/ui/ProductImage'
import QuantityStepper from '@/components/ui/QuantityStepper'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingSkeleton, SummaryRow } from '@/components/ui/ListHelpers'
import { updateItem, removeItem, clearCart } from '@/lib/api/cart'
import { useBuyerCart } from '@/hooks/useBuyerCart'
import { formatRupiah } from '@/lib/format'
import { BUYER_NAV } from '@/lib/nav'

export default function BuyerCartPage() {
  const router = useRouter()
  const { lineItems, subtotal, isLoading, isEmpty, isReady, isError, clearCartCache, refreshCart, syncCart } = useBuyerCart()

  const handleUpdate = async (productId: string, qty: number) => {
    const res = await updateItem(productId, { quantity: qty })
    syncCart(res.data.data ?? null)
  }

  const handleRemove = async (productId: string) => {
    const res = await removeItem(productId)
    syncCart(res.data.data ?? null)
  }

  const handleClear = async () => {
    if (!confirm('Kosongkan keranjang?')) return
    await clearCart()
    clearCartCache()
  }

  return (
    <DashboardLayout title="Keranjang" subtitle="Review item sebelum checkout" navItems={BUYER_NAV} role="BUYER">
      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : isError ? (
        <EmptyState
          icon={ShoppingCart}
          title="Gagal memuat keranjang"
          description="Silakan logout lalu login ulang sebagai buyer, atau coba refresh halaman."
          action={<Button variant="primary" onClick={() => refreshCart()}>Coba Lagi</Button>}
        />
      ) : isEmpty ? (
        <EmptyState
          icon={ShoppingCart}
          title="Keranjang kosong"
          description="Yuk, belanja produk laut segar dulu!"
          action={<Link href="/products"><Button variant="primary">Belanja Sekarang</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-3">
            {lineItems.map((item) => (
              <Card key={item.product_id}>
                <div className="flex gap-4">
                  <ProductImage
                    name={item.name}
                    size="sm"
                    className="h-16 w-16 flex-shrink-0 rounded-xl sm:h-20 sm:w-20"
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {item.name}
                        </p>
                        {item.store_name && (
                          <p className="text-xs text-slate-500">{item.store_name}</p>
                        )}
                        <p className="text-sm font-medium text-ocean-600">
                          {formatRupiah(item.price)} / item
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatRupiah(item.lineTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.product_id)}
                        className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="mb-2 text-xs font-medium text-slate-500">Jumlah</p>
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(qty) => handleUpdate(item.product_id, qty)}
                        min={1}
                        max={item.stock || 99}
                        step={1}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="ghost" onClick={handleClear} className="self-start">
              Kosongkan Keranjang
            </Button>
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
            <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
            <div className="divider" />
            <SummaryRow label="Total" value={formatRupiah(subtotal)} bold highlight />
            <Button
              className="mt-4 w-full"
              onClick={() => router.push('/buyer/checkout')}
              disabled={!isReady || subtotal <= 0}
            >
              Lanjut Checkout
            </Button>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
