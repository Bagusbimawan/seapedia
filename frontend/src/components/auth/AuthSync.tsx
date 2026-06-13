'use client'

import { useEffect } from 'react'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Role } from '@/types'

/** Keeps zustand auth state aligned with cookies (middleware source of truth). */
export default function AuthSync() {
  useEffect(() => {
    const cookieToken = Cookies.get('seapedia-token')
    const cookieRole = Cookies.get('seapedia-role') as Role | undefined
    const { token, activeRole, isAuthenticated, setActiveRole, clearAuth } = useAuthStore.getState()

    if (!cookieToken) {
      if (isAuthenticated) clearAuth()
      return
    }

    if (token !== cookieToken) {
      if (cookieRole && cookieRole !== 'PENDING') {
        setActiveRole(cookieToken, cookieRole)
      }
      return
    }

    if (cookieRole && activeRole !== cookieRole) {
      setActiveRole(cookieToken, cookieRole)
    }
  }, [])

  return null
}
