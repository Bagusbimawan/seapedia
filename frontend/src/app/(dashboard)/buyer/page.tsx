'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Wallet, ShoppingCart, Package, Store } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatCard from '@/components/ui/StatCard'
import Button from '@/components/ui/Button'
import { getBalance } from '@/lib/api/wallet'
import { getCart } from '@/lib/api/cart'
import { buyerOrders } from '@/lib/api/orders'
import { formatRupiah } from '@/lib/format'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { BUYER_NAV } from '@/lib/nav'

export default function BuyerDashboardPage() {
  const walletKey = useScopedQueryKey('buyer-wallet')
  const cartKey = useScopedQueryKey('buyer-cart')
  const ordersKey = useScopedQueryKey('buyer-orders-summary')

  const { data: wallet } = useQuery({
    queryKey: walletKey,
    queryFn: async () => (await getBalance()).data.data,
  })
  const { data: cart } = useQuery({
    queryKey: cartKey,
    queryFn: async () => (await getCart()).data.data,
  })
  const { data: orders } = useQuery({
    queryKey: ordersKey,
    queryFn: async () => (await buyerOrders({ limit: 5 })).data.data,
  })

  return (
    <DashboardLayout
      title="Dashboard Buyer"
      subtitle="Kelola dompet, keranjang, dan pesanan Anda"
      navItems={BUYER_NAV}
      role="BUYER"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo Dompet" value={formatRupiah(wallet?.balance ?? 0)} icon={Wallet} color="green" />
        <StatCard label="Item Keranjang" value={cart?.items?.length ?? 0} icon={ShoppingCart} color="blue" />
        <StatCard label="Total Pesanan" value={orders?.total ?? 0} icon={Package} color="purple" />
        <StatCard label="Belanja Lagi" value="→" icon={Store} color="ocean" sub="Jelajahi produk" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/buyer/cart"><Button variant="primary">Lihat Keranjang</Button></Link>
        <Link href="/buyer/wallet"><Button variant="secondary">Top Up Dompet</Button></Link>
        <Link href="/products"><Button variant="ghost">Belanja Produk</Button></Link>
      </div>
    </DashboardLayout>
  )
}
