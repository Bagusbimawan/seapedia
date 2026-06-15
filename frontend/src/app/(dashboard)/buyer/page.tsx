'use client'

import Link from 'next/link'
import { Wallet, ShoppingCart, Package, Store } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { OrderListItem } from '@/components/ui/ListHelpers'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatRupiah, formatDate } from '@/lib/format'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBuyerStore } from '@/stores/useBuyerStore'
import { useCartStore } from '@/stores/useCartStore'
import { BUYER_NAV } from '@/lib/nav'
import type { OrderStatus } from '@/types'

export default function BuyerDashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const wallet = useBuyerStore((s) => s.wallet)
  const walletLoading = useBuyerStore((s) => s.walletLoading)
  const walletError = useBuyerStore((s) => s.walletError)
  const orders = useBuyerStore((s) => s.orders)
  const ordersLoading = useBuyerStore((s) => s.ordersLoading)
  const ordersError = useBuyerStore((s) => s.ordersError)
  const fetchWallet = useBuyerStore((s) => s.fetchWallet)
  const fetchOrders = useBuyerStore((s) => s.fetchOrders)
  const cart = useCartStore((s) => s.cart)
  const fetchCart = useCartStore((s) => s.fetchCart)

  useFetchOnAuth(() => {
    void fetchWallet()
    void fetchCart()
    void fetchOrders({ limit: 5 })
  }, [])

  const orderItems = orders?.items ?? []
  const showOrdersLoading = ordersLoading && !orders

  return (
    <DashboardLayout
      title="Dashboard Buyer"
      subtitle="Kelola dompet, keranjang, dan riwayat pembelian Anda"
      navItems={BUYER_NAV}
      role="BUYER"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Saldo Dompet"
          value={
            walletLoading || (isAuthenticated && !wallet && !walletError)
              ? '...'
              : walletError
                ? '—'
                : formatRupiah(wallet?.balance ?? 0)
          }
          icon={Wallet}
          color="green"
        />
        <StatCard label="Item Keranjang" value={cart?.items?.length ?? 0} icon={ShoppingCart} color="blue" />
        <StatCard label="Total Pesanan" value={orders?.total ?? 0} icon={Package} color="purple" />
        <StatCard label="Belanja Lagi" value="→" icon={Store} color="ocean" sub="Jelajahi produk" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/buyer/cart"><Button variant="primary">Lihat Keranjang</Button></Link>
        <Link href="/buyer/wallet"><Button variant="secondary">Top Up Dompet</Button></Link>
        <Link href="/products"><Button variant="ghost">Belanja Produk</Button></Link>
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Riwayat Pembelian</CardTitle>
          <Link href="/buyer/orders">
            <Button size="sm" variant="ghost">Lihat Semua</Button>
          </Link>
        </CardHeader>

        {showOrdersLoading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ) : ordersError ? (
          <EmptyState
            icon={Package}
            title="Gagal memuat riwayat"
            description="Tarik refresh halaman atau buka menu Riwayat Pembelian."
          />
        ) : orderItems.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Belum ada pembelian"
            description="Riwayat pesanan Anda akan muncul di sini setelah checkout"
            action={<Link href="/products"><Button variant="primary" size="sm">Mulai Belanja</Button></Link>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {orderItems.map((order) => (
              <OrderListItem
                key={order.id}
                id={order.id}
                total={formatRupiah(order.total)}
                date={formatDate(order.created_at)}
                status={<OrderStatusBadge status={order.status as OrderStatus} />}
                action={
                  <Link href={`/buyer/orders/${order.id}`}>
                    <Button size="sm" variant="secondary">Detail</Button>
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  )
}
