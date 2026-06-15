'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import { usePublicStore } from '@/stores/usePublicStore'

export default function FeaturedProducts() {
  const products = usePublicStore((s) => s.products)
  const productsLoading = usePublicStore((s) => s.productsLoading)
  const fetchProducts = usePublicStore((s) => s.fetchProducts)

  useEffect(() => {
    void fetchProducts({ limit: 8 })
  }, [fetchProducts])

  const items = products?.items ?? []

  return (
    <section className="bg-slate-50 py-16">
      <div className="container-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Produk Unggulan</h2>
            <p className="mt-1 text-sm text-slate-500">Pilihan terbaik minggu ini</p>
          </div>
          <Link href="/products" className="flex items-center gap-1 text-sm font-semibold text-ocean-600 hover:text-ocean-700">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {productsLoading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400">
            <p>Belum ada produk tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
