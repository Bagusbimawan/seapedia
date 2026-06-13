import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Wallet,
  MapPin,
  ShoppingCart,
  Package,
  Store,
  Boxes,
  TrendingUp,
  Truck,
  History,
  Users,
  Building2,
  Tag,
  ClipboardList,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const BUYER_NAV: NavItem[] = [
  { href: '/buyer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/buyer/wallet', label: 'Dompet', icon: Wallet },
  { href: '/buyer/addresses', label: 'Alamat', icon: MapPin },
  { href: '/buyer/cart', label: 'Keranjang', icon: ShoppingCart },
  { href: '/buyer/orders', label: 'Pesanan', icon: Package },
]

export const SELLER_NAV: NavItem[] = [
  { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/store', label: 'Toko', icon: Store },
  { href: '/seller/products', label: 'Produk', icon: Boxes },
  { href: '/seller/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/seller/income', label: 'Pendapatan', icon: TrendingUp },
]

export const DRIVER_NAV: NavItem[] = [
  { href: '/driver', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/driver/jobs', label: 'Pekerjaan', icon: Truck },
  { href: '/driver/history', label: 'Riwayat', icon: History },
]

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Pengguna', icon: Users },
  { href: '/admin/stores', label: 'Toko', icon: Building2 },
  { href: '/admin/orders', label: 'Pesanan', icon: Package },
  { href: '/admin/discounts', label: 'Diskon', icon: Tag },
]
