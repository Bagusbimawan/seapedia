'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { addItem } from '@/lib/api/cart'
import { useCartStore } from '@/stores/useCartStore'
import { getApiError } from '@/lib/apiError'
import Button from '@/components/ui/Button'
import QuantityStepper from '@/components/ui/QuantityStepper'

interface AddToCartButtonProps {
  productId: string
  stock: number
}

export default function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const { isAuthenticated, activeRole } = useAuth()
  const router = useRouter()
  const setCart = useCartStore((s) => s.setCart)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleAdd = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/products/' + productId)
      return
    }
    if (activeRole !== 'BUYER') {
      setError('Hanya pembeli yang bisa menambahkan ke keranjang.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await addItem({ product_id: productId, quantity: qty })
      setCart(res.data.data ?? null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(getApiError(err, 'Gagal menambahkan ke keranjang.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <QuantityStepper
          label="Jumlah"
          value={qty}
          onChange={setQty}
          min={1}
          max={stock}
          step={1}
          className="w-full sm:w-40"
        />
        <Button
          variant="primary"
          size="lg"
          onClick={handleAdd}
          isLoading={loading}
          className="w-full sm:flex-1"
        >
          <ShoppingCart className="h-5 w-5" />
          Tambah ke Keranjang
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600">
          Berhasil ditambahkan!{' '}
          <button onClick={() => router.push('/buyer/cart')} className="font-medium underline">
            Lihat keranjang
          </button>
        </p>
      )}
    </div>
  )
}
