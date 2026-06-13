import type { Metadata } from 'next'
import Link from 'next/link'
import { Fish, Waves, Shield, Truck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Autentikasi',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-ocean-gradient p-12 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Fish className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Seapedia</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Marketplace Produk Laut<br />
            <span className="text-gradient">Terpercaya Indonesia</span>
          </h2>
          <p className="mt-4 max-w-md text-ocean-200 leading-relaxed">
            Belanja segar, jual dengan mudah, atau antar pesanan — semua dalam satu platform.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {[
              { icon: Fish, text: 'Produk laut segar dari nelayan' },
              { icon: Truck, text: 'Pengiriman INSTANT, NEXT_DAY, REGULAR' },
              { icon: Shield, text: 'Pembayaran aman via dompet digital' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-ocean-100">
                <div className="rounded-lg bg-white/10 p-2"><Icon className="h-4 w-4" /></div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ocean-400">
          <Waves className="h-4 w-4" />
          COMPFEST 18 — Software Engineering Academy
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col bg-slate-50">
        <header className="flex items-center justify-between px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold text-ocean-700">
            <Fish className="h-5 w-5" />
            Seapedia
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
