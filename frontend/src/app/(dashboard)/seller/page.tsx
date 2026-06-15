'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Store, Package, ShoppingBag } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { sellerGetStore } from '@/lib/api/stores'
import { sellerListProducts } from '@/lib/api/products'
import { sellerOrders } from '@/lib/api/orders'
import { useAuth } from '@/hooks/useAuth'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { SELLER_NAV } from '@/lib/nav'

export default function SellerDashboardPage() {
  const { isReady } = useAuth()
  const storeKey = useScopedQueryKey('seller-store')
  const productsCountKey = useScopedQueryKey('seller-products-count')
  const ordersCountKey = useScopedQueryKey('seller-orders-count')

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: storeKey,
    queryFn: async () => {
      try { return (await sellerGetStore()).data.data } catch { return null }
    },
    enabled: isReady,
    ...cachedQueryOptions,
  })
  const { data: products } = useQuery({
    queryKey: productsCountKey,
    queryFn: async () => (await sellerListProducts({ limit: 1 })).data.data,
    enabled: !!store,
    ...cachedQueryOptions,
  })
  const { data: orders } = useQuery({
    queryKey: ordersCountKey,
    queryFn: async () => (await sellerOrders({ limit: 1 })).data.data,
    enabled: !!store,
    ...cachedQueryOptions,
  })

  const isLoading = !isReady || storeLoading

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
