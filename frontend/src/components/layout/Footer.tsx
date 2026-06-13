import Link from 'next/link'
import { Fish } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-600">
                <Fish className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">Seapedia</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed">
              Marketplace produk laut Indonesia. Segar, terpercaya, dan terjangkau.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Jelajahi</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">Semua Produk</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition-colors">Ulasan</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Daftar Akun</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Peran</h3>
            <ul className="space-y-2 text-sm">
              <li>Pembeli — belanja & checkout</li>
              <li>Penjual — kelola toko & produk</li>
              <li>Driver — antar pesanan</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs">
          &copy; {year} Seapedia. COMPFEST 18 — Software Engineering Academy.
        </div>
      </div>
    </footer>
  )
}
