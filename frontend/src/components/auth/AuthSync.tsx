'use client'

import { useEffect } from 'react'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  clearSession,
  establishSession,
  fetchMeWithToken,
  getActiveRoleFromToken,
  getUserIdFromToken,
  updateActiveRole,
} from '@/lib/authSession'
import { switchRole as switchRoleApi } from '@/lib/api/auth'
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
        if (isAuthenticated) clearSession({ redirect: false })
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
          establishSession(cookieToken, me, role, { forceClear: true })
        } catch {
          clearSession({ redirect: false })
        }
        return
      }

      const jwtRole = getActiveRoleFromToken(cookieToken)
      if (cookieRole && cookieRole !== 'PENDING' && jwtRole && jwtRole !== cookieRole) {
        try {
          const res = await switchRoleApi(cookieRole)
          const data = res.data.data
          if (data?.token) {
            updateActiveRole(data.token, data.active_role)
          }
        } catch {
          // Cookie role tidak valid untuk JWT — biarkan middleware/handler tangani
        }
        return
      }

      if (cookieRole && activeRole !== cookieRole && jwtRole === cookieRole) {
        useAuthStore.getState().setActiveRole(cookieToken, cookieRole)
        return
      }
    }

    sync()

    const onFocus = () => {
      void sync()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [hasHydrated])

  return null
}
