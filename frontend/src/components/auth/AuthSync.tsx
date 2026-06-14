'use client'

import { useEffect } from 'react'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  clearSession,
  establishSession,
  fetchMeWithToken,
  getUserIdFromToken,
  updateActiveRole,
} from '@/lib/authSession'
import type { Role } from '@/types'

/** Keeps zustand auth + React Query aligned with cookies (middleware source of truth). */
export default function AuthSync() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  useEffect(() => {
    if (!hasHydrated) return

    const sync = async () => {
      const cookieToken = Cookies.get('seapedia-token')
      const cookieRole = Cookies.get('seapedia-role') as Role | undefined
      const { token, user, activeRole, isAuthenticated } = useAuthStore.getState()

      if (!cookieToken) {
        if (isAuthenticated) clearSession()
        return
      }

      const cookieUserId = getUserIdFromToken(cookieToken)
      const storeUserId = getUserIdFromToken(token)
      const userMismatch = !user || user.id !== cookieUserId

      if (cookieToken !== token || storeUserId !== cookieUserId || userMismatch) {
        try {
          const me = await fetchMeWithToken(cookieToken)
          const role =
            cookieRole && cookieRole !== 'PENDING'
              ? cookieRole
              : me.roles.length === 1
                ? (me.roles[0] as Role)
                : 'PENDING'
          establishSession(cookieToken, me, role)
        } catch {
          clearSession()
        }
        return
      }

      if (cookieRole && activeRole !== cookieRole) {
        updateActiveRole(cookieToken, cookieRole)
      }
    }

    sync()

    const onFocus = () => {
      sync()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [hasHydrated])

  return null
}
