'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Wallet } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import QuantityStepper from '@/components/ui/QuantityStepper'
import { getBalance, topup, getTransactions } from '@/lib/api/wallet'
import { useAuth } from '@/hooks/useAuth'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import { formatRupiah, formatDate } from '@/lib/format'
import { BUYER_NAV } from '@/lib/nav'

const TOPUP_PRESETS = [50000, 100000, 200000, 500000]

const TX_TYPE_LABEL: Record<string, string> = {
  TOPUP: 'Top Up',
  PAYMENT: 'Pembayaran',
  REFUND: 'Refund',
}

export default function BuyerWalletPage() {
  const queryClient = useQueryClient()
  const { isReady } = useAuth()
  const walletKey = useScopedQueryKey('buyer-wallet')
  const txsKey = useScopedQueryKey('buyer-wallet-txs')
  const [amount, setAmount] = useState(100000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: wallet, isLoading } = useQuery({
    queryKey: walletKey,
    queryFn: async () => (await getBalance()).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  const { data: txs } = useQuery({
    queryKey: txsKey,
    queryFn: async () => (await getTransactions({ limit: 50 })).data.data,
    enabled: isReady,
    ...cachedQueryOptions,
  })

  const handleTopup = async () => {
    if (amount < 10000) {
      setError('Minimum top up Rp 10.000')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await topup({ amount })
      await queryClient.invalidateQueries({ queryKey: walletKey })
      await queryClient.invalidateQueries({ queryKey: txsKey })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Topup gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="Dompet" subtitle="Kelola saldo dan riwayat transaksi" navItems={BUYER_NAV} role="BUYER">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2 xl:items-start">
        <Card className="xl:sticky xl:top-24">
          <CardHeader><CardTitle>Saldo Saat Ini</CardTitle></CardHeader>
          {isLoading ? (
            <div className="h-10 animate-pulse rounded-xl bg-slate-200" />
          ) : (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="rounded-2xl bg-emerald-50 p-3 sm:p-4">
                <Wallet className="h-7 w-7 text-emerald-600 sm:h-8 sm:w-8" />
              </div>
              <p className="min-w-0 break-words text-2xl font-bold text-emerald-600 sm:text-3xl">
                {formatRupiah(wallet?.balance ?? 0)}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <QuantityStepper
              label="Jumlah Top Up"
              value={amount}
              onChange={setAmount}
              min={10000}
              max={10000000}
              step={50000}
              variant="currency"
              formatDisplay={(v) => formatRupiah(v)}
            />

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {TOPUP_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition-colors sm:py-1.5 ${
                    amount === preset
                      ? 'bg-ocean-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formatRupiah(preset)}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleTopup} isLoading={loading} className="w-full">
              Top Up Saldo
            </Button>
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col">
          <CardHeader>
            <CardTitle>
              Riwayat Transaksi
              {txs?.items?.length ? (
                <span className="ml-2 text-sm font-normal text-slate-400">({txs.items.length})</span>
              ) : null}
            </CardTitle>
          </CardHeader>

          {!txs?.items?.length ? (
            <p className="text-sm text-slate-500">Belum ada transaksi.</p>
          ) : (
            <div className="max-h-[min(480px,65vh)] overflow-y-auto pr-1 scrollbar-thin sm:max-h-[min(420px,60vh)]">
              <div className="flex flex-col gap-2">
                {txs.items.map((tx) => (
                  <div
                    key={tx.id}
                    className="rounded-xl border border-slate-100 px-3 py-3 transition-colors hover:bg-slate-50 sm:px-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {TX_TYPE_LABEL[tx.type] ?? tx.type}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(tx.created_at)}</p>
                      </div>
                      <div className="flex items-end justify-between gap-3 sm:block sm:flex-shrink-0 sm:text-right">
                        <p className={`font-semibold tabular-nums ${tx.type === 'PAYMENT' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.type === 'PAYMENT' ? '-' : '+'}{formatRupiah(tx.amount)}
                        </p>
                        <p className="text-xs text-slate-400 sm:mt-0.5">
                          Saldo: {formatRupiah(tx.balance_after)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
