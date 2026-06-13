import Link from 'next/link'
import ProductImage from './ProductImage'
import { formatRupiah } from '@/lib/format'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const lowStock = product.stock > 0 && product.stock <= 10

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-ocean-200 hover:shadow-card-hover">
        <ProductImage name={product.name} size="md" className="rounded-none rounded-t-2xl" />
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-ocean-700 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-1 text-xs text-slate-500">{product.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-base font-bold text-ocean-700">{formatRupiah(product.price)}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                product.stock === 0
                  ? 'bg-red-50 text-red-600'
                  : lowStock
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {product.stock === 0 ? 'Habis' : `Stok ${product.stock}`}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
