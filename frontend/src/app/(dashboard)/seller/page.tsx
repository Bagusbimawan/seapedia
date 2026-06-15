'use client'

import Link from 'next/link'
import { Store, Package, ShoppingBag } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useSellerStore } from '@/stores/useSellerStore'
import { SELLER_NAV } from '@/lib/nav'

export default function SellerDashboardPage() {
  const store = useSellerStore((s) => s.store)
  const storeLoading = useSellerStore((s) => s.storeLoading)
  const products = useSellerStore((s) => s.products)
  const orders = useSellerStore((s) => s.orders)
  const fetchStore = useSellerStore((s) => s.fetchStore)
  const fetchProducts = useSellerStore((s) => s.fetchProducts)
  const fetchOrders = useSellerStore((s) => s.fetchOrders)

  useFetchOnAuth(() => {
    void fetchStore()
  }, [])

  useFetchOnAuth(() => {
    if (store) {
      void fetchProducts({ limit: 1 })
      void fetchOrders({ limit: 1 })
    }
  }, [store?.id])

  const isLoading = storeLoading && !store

  return (
    <DashboardLayout title="Dashboard Seller" subtitle="Kelola toko dan pesanan" navItems={SELLER_NAV} role="SELLER">
      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ) : !store ? (
        <EmptyState
          icon={Store}
          title="Belum ada toko"
          description="Buat toko Anda untuk mulai menjual produk laut"
          action={
            <Link href="/seller/store">
              <Button variant="primary">Buat Toko Sekarang</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Nama Toko" value={store.name} icon={Store} color="amber" />
            <StatCard label="Total Produk" value={products?.total ?? 0} icon={Package} color="ocean" />
            <StatCard label="Total Pesanan" value={orders?.total ?? 0} icon={ShoppingBag} color="purple" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/seller/products"><Button variant="primary">Kelola Produk</Button></Link>
            <Link href="/seller/orders"><Button variant="secondary">Lihat Pesanan</Button></Link>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
