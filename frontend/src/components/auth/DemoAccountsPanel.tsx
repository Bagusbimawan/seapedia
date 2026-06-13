'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { DEMO_ACCOUNTS, DEMO_VOUCHER } from '@/lib/demoAccounts'

interface DemoAccountsPanelProps {
  onSelect?: (email: string, password: string) => void
}

export default function DemoAccountsPanel({ onSelect }: DemoAccountsPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
      <p className="mb-1 text-sm font-semibold text-amber-900">Akun Demo untuk Panitia</p>
      <p className="mb-3 text-xs text-amber-700">Klik baris untuk mengisi form login, atau salin kredensial.</p>

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
            {DEMO_ACCOUNTS.map((acc) => (
              <tr
                key={acc.email}
                className="cursor-pointer border-t border-amber-100 transition-colors hover:bg-amber-50"
                onClick={() => onSelect?.(acc.email, acc.password)}
              >
                <td className="px-3 py-2 font-medium text-slate-800">
                  {acc.role}
                  {acc.note && <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{acc.note}</span>}
                </td>
                <td className="px-3 py-2 text-slate-600">{acc.email}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-700">{acc.password}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopy(`${acc.email} / ${acc.password}`, acc.email) }}
                      className="rounded p-0.5 text-amber-600 hover:bg-amber-100"
                      title="Salin kredensial"
                    >
                      {copied === acc.email ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
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
