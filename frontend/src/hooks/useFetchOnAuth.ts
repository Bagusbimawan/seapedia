'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { getUserIdFromToken } from '@/lib/authSession'

/** Panggil fetch store saat user sudah login + zustand hydrated. Re-run saat userId berubah (login/logout). */
export function useFetchOnAuth(fetcher: () => void | Promise<void>, deps: unknown[] = []) {
  const token = useAuthStore((s) => s.token)
  const authReady = useAuthStore((s) => s.hasHydrated && !!s.token)
  const userId = useAuthStore((s) => s.user?.id) ?? getUserIdFromToken(token)

  useEffect(() => {
    if (!authReady || !userId || userId === 'anon') return
    void fetcher()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId, ...deps])
}
