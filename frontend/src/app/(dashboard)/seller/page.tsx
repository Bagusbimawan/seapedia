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
import { useScopedQueryKey } from '@/lib/queryKeys'
import { SELLER_NAV } from '@/lib/nav'

export default function SellerDashboardPage() {
  const storeKey = useScopedQueryKey('seller-store')
  const productsCountKey = useScopedQueryKey('seller-products-count')
  const ordersCountKey = useScopedQueryKey('seller-orders-count')

  const { data: store } = useQuery({
    queryKey: storeKey,
    queryFn: async () => {
      try { return (await sellerGetStore()).data.data } catch { return null }
    },
  })
  const { data: products } = useQuery({
    queryKey: productsCountKey,
    queryFn: async () => (await sellerListProducts({ limit: 1 })).data.data,
    enabled: !!store,
  })
  const { data: orders } = useQuery({
    queryKey: ordersCountKey,
    queryFn: async () => (await sellerOrders({ limit: 1 })).data.data,
    enabled: !!store,
  })

  return (
    <DashboardLayout title="Dashboard Seller" subtitle="Kelola toko dan pesanan" navItems={SELLER_NAV} role="SELLER">
      {!store ? (
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
