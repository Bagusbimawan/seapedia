'use client'

import { useState } from 'react'
import { CheckCircle2, Wallet } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { topup } from '@/lib/api/wallet'
import { getApiError } from '@/lib/apiError'
import { useAuthStore } from '@/stores/useAuthStore'
import { useFetchOnAuth } from '@/hooks/useFetchOnAuth'
import { useBuyerStore } from '@/stores/useBuyerStore'
import { formatRupiah, formatDate } from '@/lib/format'
import { BUYER_NAV } from '@/lib/nav'

const TOPUP_PRESETS = [50000, 100000, 200000, 500000]

const TX_TYPE_LABEL: Record<string, string> = {
  TOPUP: 'Top Up',
  PAYMENT: 'Pembayaran',
  REFUND: 'Refund',
}

export default function BuyerWalletPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const wallet = useBuyerStore((s) => s.wallet)
  const walletLoading = useBuyerStore((s) => s.walletLoading)
  const walletError = useBuyerStore((s) => s.walletError)
  const transactions = useBuyerStore((s) => s.transactions)
  const fetchWallet = useBuyerStore((s) => s.fetchWallet)
  const setWallet = useBuyerStore((s) => s.setWallet)
  const fetchTransactions = useBuyerStore((s) => s.fetchTransactions)

  const [amount, setAmount] = useState(100000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useFetchOnAuth(() => {
    void fetchWallet()
    void fetchTransactions()
  }, [])

  const handleTopup = async () => {
    if (amount < 10000) {
      setError('Minimum top up Rp 10.000')
      return
    }
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await topup({ amount })
      const updated = res.data.data
      if (!updated) throw new Error('Respons top up tidak valid')

      setWallet(updated)
      await fetchTransactions()

      setSuccess(`Berhasil top up ${formatRupiah(amount)}! Saldo sekarang ${formatRupiah(updated.balance)}.`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: unknown) {
      setError(getApiError(err, 'Top up gagal. Pastikan login sebagai buyer.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Dompet" subtitle="Kelola saldo dan riwayat transaksi" navItems={BUYER_NAV} role="BUYER">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {success && (
          <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-8 text-white">
            <p className="text-sm font-medium text-emerald-100">Saldo Saat Ini</p>
            {walletLoading || (isAuthenticated && !wallet && !walletError) ? (
              <div className="mt-2 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
            ) : walletError ? (
              <p className="mt-1 text-lg text-emerald-100">Gagal memuat saldo</p>
            ) : (
              <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {formatRupiah(wallet?.balance ?? 0)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-5 p-6">
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700">Pilih nominal top up</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TOPUP_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`rounded-xl border-2 px-3 py-3 text-center text-sm font-semibold transition-colors ${
                      amount === preset
                        ? 'border-ocean-600 bg-ocean-50 text-ocean-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-ocean-200 hover:bg-slate-50'
                    }`}
                  >
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Nominal dipilih</p>
              <p className="text-xl font-bold text-slate-900">{formatRupiah(amount)}</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleTopup} isLoading={loading} className="w-full" size="lg">
              <Wallet className="h-5 w-5" />
              Top Up Saldo
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Riwayat Transaksi
              {transactions?.items?.length ? (
                <span className="ml-2 text-sm font-normal text-slate-400">({transactions.items.length})</span>
              ) : null}
            </CardTitle>
          </CardHeader>

          {!transactions?.items?.length ? (
            <p className="text-sm text-slate-500">Belum ada transaksi.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.items.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{TX_TYPE_LABEL[tx.type] ?? tx.type}</p>
                    <p className="text-xs text-slate-400">{formatDate(tx.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold tabular-nums ${tx.type === 'PAYMENT' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {tx.type === 'PAYMENT' ? '-' : '+'}{formatRupiah(tx.amount)}
                    </p>
                    <p className="text-xs text-slate-400">Saldo: {formatRupiah(tx.balance_after)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
