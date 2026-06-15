'use client'

import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import { getUserIdFromToken } from '@/lib/authSession'

/** Token aktif — dari zustand atau cookie (axios interceptor juga pakai zustand). */
export function getActiveToken(): string | null {
  if (typeof window === 'undefined') return null
  return useAuthStore.getState().token || Cookies.get('seapedia-token') || null
}

/**
 * Siap fetch data autentikasi — jangan blokir selamanya menunggu hasHydrated.
 * Cukup ada JWT (store atau cookie).
 */
export function useAuthReady() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const storeToken = useAuthStore((s) => s.token)
  const cookieToken =
    typeof window !== 'undefined' ? Cookies.get('seapedia-token') ?? null : null
  const token = storeToken || cookieToken
  const userId =
    useAuthStore((s) => s.user?.id) ?? getUserIdFromToken(token)

  return {
    ready: !!token && userId !== 'anon',
    token,
    userId,
    hasHydrated,
  }
}
