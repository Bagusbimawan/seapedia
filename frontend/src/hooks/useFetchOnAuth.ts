'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

/** Panggil fetch store saat user sudah login + zustand hydrated. Re-run saat userId berubah (login/logout). */
export function useFetchOnAuth(fetcher: () => void | Promise<void>, deps: unknown[] = []) {
  const authReady = useAuthStore((s) => s.hasHydrated && !!s.token)
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!authReady || !userId) return
    void fetcher()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId, ...deps])
}
