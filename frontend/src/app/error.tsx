'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center">
      <h1 className="text-xl font-bold text-slate-900">Terjadi kesalahan</h1>
      <p className="max-w-md text-sm text-slate-600">
        Halaman gagal dimuat. Coba refresh — jika baru deploy, tekan Ctrl+Shift+R (hard refresh)
        untuk menghapus cache browser.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-ocean-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700"
        >
          Coba Lagi
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh Halaman
        </button>
      </div>
    </div>
  )
}
