'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Fish } from 'lucide-react'
import { listProducts } from '@/lib/api/products'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/ui/PageHeader'
import ProductCard from '@/components/ui/ProductCard'
import EmptyState from '@/components/ui/EmptyState'

const LIMIT = 12

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', search, page],
    queryFn: async () => (await listProducts({ search, page, limit: LIMIT })).data.data,
  })

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="container-page page-section">
      <PageHeader
        title="Semua Produk"
        subtitle="Temukan produk laut segar pilihan terbaik dari penjual terpercaya"
      />

      <form onSubmit={handleSearch} className="mb-8 flex max-w-xl gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari ikan, udang, rumput laut..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="primary">
          <Search className="h-4 w-4" />
          Cari
        </Button>
      </form>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState icon={Fish} title="Gagal memuat produk" description="Pastikan backend sedang berjalan di localhost:8080" />
      )}

      {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
        <EmptyState
          icon={Fish}
          title={search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada produk'}
          description="Coba kata kunci lain atau jalankan seed data"
        />
      )}

      {!isLoading && !isError && data?.items && data.items.length > 0 && (
        <>
          <p className="mb-4 text-sm text-slate-500">{data.total} produk ditemukan</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" /> Sebelumnya
              </Button>
              <span className="text-sm text-slate-600">Halaman {page} / {totalPages}</span>
              <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Selanjutnya <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
