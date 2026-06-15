'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Wallet, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import { SelectionOption, SummaryRow } from '@/components/ui/ListHelpers'
import { checkout } from '@/lib/api/orders'
import { validate } from '@/lib/api/discounts'
import { getApiError } from '@/lib/apiError'
import { useBuyerCart } from '@/hooks/useBuyerCart'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useBuyerStore } from '@/stores/useBuyerStore'
import { useCartStore } from '@/stores/useCartStore'
import { formatRupiah } from '@/lib/format'
import { BUYER_NAV } from '@/lib/nav'
import type { DeliveryMethod } from '@/types'

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; fee: number }[] = [
  { value: 'INSTANT', label: 'Instant (1 hari)', fee: 25000 },
  { value: 'NEXT_DAY', label: 'Next Day (2 hari)', fee: 15000 },
  { value: 'REGULAR', label: 'Regular (5 hari)', fee: 10000 },
]

export default function BuyerCheckoutPage() {
  const router = useRouter()
  const { lineItems, subtotal, isLoading, isEmpty, isReady, isFetching, clearCartCache } = useBuyerCart()

  const addresses = useBuyerStore((s) => s.addresses)
  const wallet = useBuyerStore((s) => s.wallet)
  const fetchAddresses = useBuyerStore((s) => s.fetchAddresses)
  const fetchWallet = useBuyerStore((s) => s.fetchWallet)
  const fetchOrders = useBuyerStore((s) => s.fetchOrders)
  const fetchCart = useCartStore((s) => s.fetchCart)

  const [addressId, setAddressId] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('NEXT_DAY')
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountValidated, setDiscountValidated] = useState(false)
  const [discountLabel, setDiscountLabel] = useState('')
  const [validatingDiscount, setValidatingDiscount] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useFetchOnAuth(() => {
    void fetchAddresses()
    void fetchWallet()
  }, [])

  useEffect(() => {
    if (addresses.length && !addressId) {
      const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0]
      setAddressId(defaultAddr.id)
    }
  }, [addresses, addressId])

  useEffect(() => {
    if (discountValidated) {
      setDiscountValidated(false)
      setDiscountAmount(0)
      setDiscountLabel('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when cart subtotal changes
  }, [subtotal])

  const deliveryFeePerStore = DELIVERY_OPTIONS.find((d) => d.value === deliveryMethod)?.fee ?? 0
  const storeCount = useMemo(() => {
    const ids = new Set(lineItems.map((item) => item.store_id).filter(Boolean))
    return Math.max(ids.size, 1)
  }, [lineItems])
  const deliveryFee = deliveryFeePerStore * storeCount
  const taxableBase = Math.max(0, subtotal - discountAmount)
  const taxAmount = Math.floor(taxableBase * 12 / 100)
  const total = taxableBase + taxAmount + deliveryFee
  const balance = wallet?.balance ?? 0
  const insufficientBalance = isReady && total > 0 && balance < total

  const canPay =
    !paid &&
    !loading &&
    !isLoading &&
    !isFetching &&
    isReady &&
    !isEmpty &&
    !!addressId &&
    total > 0 &&
    balance >= total

  const payDisabledReason = (() => {
    if (paid) return 'Pesanan sudah dibayar'
    if (isLoading || isFetching) return 'Memuat data keranjang...'
    if (isEmpty) return 'Keranjang kosong'
    if (!addressId) return 'Pilih alamat pengiriman'
    if (total <= 0) return 'Total pembayaran tidak valid'
    if (insufficientBalance) return `Saldo kurang ${formatRupiah(total - balance)}`
    return null
  })()

  const handleValidateDiscount = async () => {
    const code = discountCode.trim().toUpperCase()
    if (!code) return
    if (subtotal <= 0) {
      setError('Subtotal belum tersedia. Tunggu keranjang selesai dimuat.')
      return
    }
    setValidatingDiscount(true)
    setDiscountValidated(false)
    setDiscountAmount(0)
    setDiscountLabel('')
    try {
      const res = await validate({ code, subtotal })
      const amount = res.data.data?.discount_amount ?? 0
      const discount = res.data.data?.discount
      if (amount <= 0) {
        setError('Kode valid tapi diskon Rp 0. Pastikan subtotal memenuhi syarat.')
        return
      }
      setDiscountCode(code)
      setDiscountAmount(amount)
      setDiscountValidated(true)
      setDiscountLabel(
        discount?.discount_type === 'PERCENT'
          ? `${code} — diskon ${discount.discount_value}%`
          : `${code} — diskon ${formatRupiah(discount?.discount_value ?? amount)}`
      )
      setError(null)
    } catch (err: unknown) {
      setDiscountAmount(0)
      setDiscountValidated(false)
      setDiscountLabel('')
      setError(getApiError(err, 'Kode diskon tidak valid'))
    } finally {
      setValidatingDiscount(false)
    }
  }

  const handleDiscountCodeChange = (value: string) => {
    setDiscountCode(value)
    setDiscountValidated(false)
    setDiscountAmount(0)
    setDiscountLabel('')
  }

  const handleCheckout = async () => {
    if (!canPay) {
      setError(payDisabledReason ?? 'Tidak dapat melakukan pembayaran')
      return
    }
    const code = discountCode.trim().toUpperCase()
    if (code && !discountValidated) {
      setError('Klik "Validasi" terlebih dahulu untuk menerapkan kode diskon.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await checkout({
        address_id: addressId,
        delivery_method: deliveryMethod,
        discount_code: code || undefined,
      })
      const orders = res.data.data?.orders ?? []
      if (!orders.length) throw new Error('Respons pesanan tidak valid')

      setPaid(true)
      clearCartCache()
      await Promise.all([fetchWallet(), fetchOrders(), fetchCart()])
      if (orders.length === 1) {
        router.replace(`/buyer/orders/${orders[0].id}`)
      } else {
        router.replace('/buyer/orders')
      }
    } catch (err: unknown) {
      setError(getApiError(err, 'Checkout gagal'))
      await Promise.all([fetchCart(), fetchWallet()])
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Checkout" navItems={BUYER_NAV} role="BUYER">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ocean-600 border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  if (isEmpty) {
    return (
      <DashboardLayout title="Checkout" navItems={BUYER_NAV} role="BUYER">
        <EmptyState
          icon={ShoppingCart}
          title="Keranjang kosong"
          description="Tambahkan produk ke keranjang terlebih dahulu"
          action={<Link href="/products"><Button variant="primary">Belanja Produk</Button></Link>}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Checkout" subtitle="Selesaikan pesanan Anda" navItems={BUYER_NAV} role="BUYER">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Item Pesanan ({lineItems.length})</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              {lineItems.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="flex justify-between text-sm">
                  <span className="text-slate-700">{item.name} × {item.quantity}</span>
                  <span className="font-medium text-slate-900">{formatRupiah(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Alamat Pengiriman</CardTitle></CardHeader>
            {!addresses.length ? (
              <p className="text-sm text-slate-500">
                Belum ada alamat.{' '}
                <Link href="/buyer/addresses" className="font-medium text-ocean-600 hover:text-ocean-700">Tambah alamat</Link>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {addresses.map((addr) => (
                  <SelectionOption
                    key={addr.id}
                    selected={addressId === addr.id}
                    onSelect={() => setAddressId(addr.id)}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{addr.label}</p>
                      <p className="text-sm text-slate-500">{addr.street}, {addr.city}</p>
                    </div>
                  </SelectionOption>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Metode Pengiriman</CardTitle></CardHeader>
            <div className="flex flex-col gap-2">
              {DELIVERY_OPTIONS.map((opt) => (
                <SelectionOption
                  key={opt.value}
                  selected={deliveryMethod === opt.value}
                  onSelect={() => setDeliveryMethod(opt.value)}
                  trailing={<span className="text-sm font-semibold text-slate-700">{formatRupiah(opt.fee)}</span>}
                >
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </SelectionOption>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Kode Diskon</CardTitle></CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Masukkan kode (contoh: DISC20)"
                value={discountCode}
                onChange={(e) => handleDiscountCodeChange(e.target.value)}
                className="flex-1 uppercase"
              />
              <Button
                variant="secondary"
                onClick={handleValidateDiscount}
                isLoading={validatingDiscount}
                disabled={!discountCode.trim() || subtotal <= 0}
                className="w-full sm:w-auto"
              >
                Validasi
              </Button>
            </div>
            {discountValidated && discountAmount > 0 && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-sm font-medium text-emerald-700">✓ {discountLabel}</p>
                <p className="text-sm text-emerald-600">Hemat: -{formatRupiah(discountAmount)}</p>
              </div>
            )}
            {discountCode.trim() && !discountValidated && (
              <p className="mt-2 text-xs text-amber-600">Tekan Validasi untuk menerapkan diskon sebelum bayar.</p>
            )}
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader><CardTitle>Ringkasan Pembayaran</CardTitle></CardHeader>

          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Wallet className="h-4 w-4" />
              Saldo dompet
            </div>
            <span className={`font-bold ${insufficientBalance ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatRupiah(balance)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
            <SummaryRow label="Diskon" value={`-${formatRupiah(discountAmount)}`} />
            <SummaryRow label="PPN 12%" value={formatRupiah(taxAmount)} />
            <SummaryRow label="Ongkir" value={formatRupiah(deliveryFee)} />
            <div className="divider" />
            <SummaryRow label="Total" value={formatRupiah(total)} bold highlight />
          </div>

          {insufficientBalance && (
            <div className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-xs text-red-700">
                Saldo tidak cukup. Butuh {formatRupiah(total - balance)} lagi.{' '}
                <Link href="/buyer/wallet" className="font-semibold underline">Top up dompet</Link>
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {payDisabledReason && !error && !canPay && (
            <p className="mt-3 text-center text-xs text-slate-500">{payDisabledReason}</p>
          )}

          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={handleCheckout}
            isLoading={loading}
            disabled={!canPay}
          >
            Bayar & Pesan
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  )
}
