'use client'

import { Copy, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDemoSellers } from '@/lib/api/demo'
import { DEMO_ACCOUNTS, DEMO_VOUCHER, KNOWN_DEMO_PASSWORDS } from '@/lib/demoAccounts'

interface DemoRow {
  role: string
  email: string
  password: string
  note?: string
  canLogin: boolean
}

interface DemoAccountsPanelProps {
  onSelect?: (email: string, password: string) => void
}

export default function DemoAccountsPanel({ onSelect }: DemoAccountsPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const { data: sellersRes } = useQuery({
    queryKey: ['demo-sellers'],
    queryFn: async () => (await getDemoSellers()).data.data ?? [],
    staleTime: 30_000,
  })

  const rows = useMemo<DemoRow[]>(() => {
    const staticEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email))
    const result: DemoRow[] = DEMO_ACCOUNTS.map((acc) => ({
      role: acc.role,
      email: acc.email,
      password: acc.password,
      note: acc.note,
      canLogin: true,
    }))

    for (const seller of sellersRes ?? []) {
      if (staticEmails.has(seller.email)) continue
      const password = KNOWN_DEMO_PASSWORDS[seller.email]
      result.push({
        role: 'Seller',
        email: seller.email,
        password: password ?? '—',
        note: seller.store_name,
        canLogin: !!password,
      })
    }

    return result
  }, [sellersRes])

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleRowClick = (row: DemoRow) => {
    if (!row.canLogin) {
      onSelect?.(row.email, '')
      return
    }
    onSelect?.(row.email, row.password)
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <p className="mb-1 text-sm font-semibold text-amber-900">Akun Demo untuk Panitia</p>
      <p className="mb-3 text-xs text-amber-700">
        Klik baris untuk mengisi form login. Seller diambil otomatis dari toko yang ada (termasuk yang dibuat admin).
      </p>

      <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-amber-100/60 text-left text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            <tr>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Password</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((acc) => (
              <tr
                key={acc.email}
                className="cursor-pointer border-t border-amber-100 transition-colors hover:bg-amber-50"
                onClick={() => handleRowClick(acc)}
              >
                <td className="px-3 py-2 font-medium text-slate-800">
                  {acc.role}
                  {acc.note && <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{acc.note}</span>}
                </td>
                <td className="px-3 py-2 text-slate-600">{acc.email}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-700">
                      {acc.canLogin ? acc.password : 'password registrasi'}
                    </span>
                    {acc.canLogin && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopy(`${acc.email} / ${acc.password}`, acc.email) }}
                        className="rounded p-0.5 text-amber-600 hover:bg-amber-100"
                        title="Salin kredensial"
                      >
                        {copied === acc.email ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[10px] text-amber-700">
        Voucher demo: <strong>{DEMO_VOUCHER.code}</strong> ({DEMO_VOUCHER.desc})
      </p>
    </div>
  )
}
