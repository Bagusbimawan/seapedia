import Link from 'next/link'
import { ShoppingBag, Truck, Shield, ArrowRight, Star, Users } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/ui/ProductCard'
import { DEMO_ACCOUNTS, DEMO_VOUCHER } from '@/lib/demoAccounts'
import type { ApiResponse, PaginatedData, Product } from '@/types'

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'}/products?limit=8`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const json: ApiResponse<PaginatedData<Product>> = await res.json()
    return json.data?.items ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ocean-gradient">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="container-page relative py-24 text-center sm:py-32">
          <div className="mx-auto max-w-3xl animate-slide-up">
            <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-ocean-200 backdrop-blur">
              🐟 Marketplace Produk Laut #1 Indonesia
            </span>
            <h1 className="mb-5 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Segar dari Laut,<br />
              <span className="text-gradient">Langsung ke Mejamu</span>
            </h1>
            <p className="mb-10 text-lg text-ocean-200 sm:text-xl">
              Temukan produk laut segar terbaik. Beli, jual, atau antar — semua dalam satu platform terpercaya.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-ocean-800 shadow-lg transition-all hover:bg-ocean-50 hover:shadow-xl">
                <ShoppingBag className="h-5 w-5" />
                Jelajahi Produk
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-7 py-3.5 font-semibold text-white transition-all hover:bg-white/10">
                Daftar Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6">
            {[
              { value: '3+', label: 'Peran' },
              { value: '100%', label: 'Aman' },
              { value: '24/7', label: 'Tersedia' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-ocean-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="container-page">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Kenapa Seapedia?</h2>
            <p className="mt-2 text-slate-500">Platform lengkap untuk semua peran marketplace</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: ShoppingBag, title: 'Produk Segar', desc: 'Ribuan produk laut segar dari seluruh Nusantara.', color: 'bg-ocean-50 text-ocean-600' },
              { icon: Truck, title: 'Pengiriman Cepat', desc: 'INSTANT, NEXT_DAY, atau REGULAR — sesuai kebutuhanmu.', color: 'bg-emerald-50 text-emerald-600' },
              { icon: Shield, title: 'Transaksi Aman', desc: 'Pembayaran via dompet digital yang terproteksi.', color: 'bg-violet-50 text-violet-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="rounded-2xl border border-slate-100 p-6 text-center transition-all hover:shadow-card hover:-translate-y-0.5">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
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

          {products.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center text-slate-400">
              <p>Belum ada produk tersedia. Jalankan backend & seed terlebih dahulu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Roles CTA */}
      <section className="bg-white py-16">
        <div className="container-page text-center">
          <h2 className="text-2xl font-bold text-slate-900">Pilih Peranmu</h2>
          <p className="mt-2 text-slate-500">Satu akun, banyak kemungkinan</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { role: 'Pembeli', desc: 'Belanja produk segar', color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
              { role: 'Penjual', desc: 'Kelola toko & produk', color: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50' },
              { role: 'Driver', desc: 'Antar pesanan', color: 'border-violet-200 hover:border-violet-400 hover:bg-violet-50' },
            ].map((r) => (
              <div key={r.role} className={`rounded-2xl border-2 p-6 transition-all ${r.color}`}>
                <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="font-semibold text-slate-900">{r.role}</p>
                <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ocean-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-ocean-600/25 transition-all hover:bg-ocean-700">
            Daftar Sekarang <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Demo accounts for panitia */}
      <section className="border-t border-amber-100 bg-amber-50/50 py-12">
        <div className="container-page">
          <h2 className="text-xl font-bold text-slate-900">Akun Demo untuk Panitia</h2>
          <p className="mt-1 text-sm text-slate-500">Gunakan kredensial berikut untuk menguji semua peran. Voucher: <strong>{DEMO_VOUCHER.code}</strong> ({DEMO_VOUCHER.desc})</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-amber-100/60 text-left text-xs font-semibold uppercase tracking-wider text-amber-800">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Password</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ACCOUNTS.map((acc) => (
                  <tr key={acc.email} className="border-t border-amber-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {acc.role}
                      {acc.note && <span className="block text-xs font-normal text-slate-500">{acc.note}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{acc.email}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{acc.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/login" className="mt-4 inline-flex text-sm font-semibold text-ocean-600 hover:text-ocean-700">
            Masuk dengan akun demo →
          </Link>
        </div>
      </section>

      {/* Reviews teaser */}
      <section className="border-t border-slate-100 bg-slate-50 py-12">
        <div className="container-page flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1,2,3,4,5].map((i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-sm text-slate-600">Lihat ulasan dari komunitas Seapedia</p>
          </div>
          <Link href="/reviews" className="text-sm font-semibold text-ocean-600 hover:text-ocean-700">
            Baca ulasan →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
