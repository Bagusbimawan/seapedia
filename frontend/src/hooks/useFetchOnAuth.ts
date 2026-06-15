'use client'

import { useEffect } from 'react'
import { useAuthReady } from '@/hooks/useAuthReady'

/** Panggil fetch store saat JWT tersedia. Re-run saat user/token berubah. */
export function useFetchOnAuth(fetcher: () => void | Promise<void>, deps: unknown[] = []) {
  const { ready, token, userId } = useAuthReady()

  useEffect(() => {
    if (!ready) return
    void fetcher()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, userId, ...deps])
}
