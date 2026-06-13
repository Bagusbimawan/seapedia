import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Store, ShoppingCart } from 'lucide-react'
import type { ApiResponse, Product, Store as StoreType } from '@/types'
import ProductImage from '@/components/ui/ProductImage'
import Badge from '@/components/ui/Badge'
import { formatRupiah } from '@/lib/format'
import AddToCartButton from './AddToCartButton'

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'}/products/${id}`,
      { next: { revalidate: 60 } }
    )
    if (res.status === 404) return null
    if (!res.ok) return null
    const json: ApiResponse<Product> = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

async function getStore(id: string): Promise<StoreType | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'}/stores/${id}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return null
    const json: ApiResponse<StoreType> = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const store = await getStore(product.store_id)

  return (
    <div className="container-page page-section">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/products" className="flex items-center gap-1 transition-colors hover:text-ocean-700">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Produk
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <ProductImage name={product.name} size="lg" className="aspect-square h-auto w-full max-h-80 rounded-2xl sm:max-h-none" />

        <div className="flex flex-col gap-5 sm:gap-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">{product.name}</h1>
            <p className="mt-2 text-2xl font-bold text-ocean-600 sm:mt-3 sm:text-3xl">{formatRupiah(product.price)}</p>
          </div>

          <div>
            {product.stock > 0 ? (
              <Badge variant="success">Stok: {product.stock}</Badge>
            ) : (
              <Badge variant="danger">Habis</Badge>
            )}
          </div>

          {product.description && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <h2 className="mb-2 text-sm font-semibold text-slate-700">Deskripsi</h2>
              <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
            </div>
          )}

          {store && (
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                <Store className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Dijual oleh</p>
                <p className="font-semibold text-slate-900">{store.name}</p>
              </div>
            </div>
          )}

          {product.stock > 0 ? (
            <AddToCartButton productId={product.id} stock={product.stock} />
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-500">
              <ShoppingCart className="h-4 w-4" />
              Produk ini sedang habis stok.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
