'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center font-sans">
        <h1 className="text-xl font-bold text-slate-900">Aplikasi error</h1>
        <p className="max-w-md text-sm text-slate-600">
          Terjadi kesalahan di browser. Jika baru deploy, lakukan hard refresh (Ctrl+Shift+R)
          atau hapus cache situs ini.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-ocean-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ocean-700"
        >
          Muat Ulang
        </button>
      </body>
    </html>
  )
}
