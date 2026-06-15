'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

/** Panggil fetch store saat user sudah login + zustand hydrated. */
export function useFetchOnAuth(fetcher: () => void | Promise<void>, deps: unknown[] = []) {
  const authReady = useAuthStore((s) => s.hasHydrated && !!s.token)

  useEffect(() => {
    if (!authReady) return
    void fetcher()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, ...deps])
}
