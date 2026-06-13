'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import { switchRole as switchRoleApi } from '@/lib/api/auth'
import type { Role } from '@/types'

type SwitchableRole = Exclude<Role, 'ADMIN' | 'PENDING'>

export function useRoleSwitch() {
  const router = useRouter()
  const { setActiveRole } = useAuthStore()
  const [loading, setLoading] = useState<SwitchableRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  const switchToRole = async (role: SwitchableRole) => {
    setError(null)
    setLoading(role)
    try {
      const res = await switchRoleApi(role)
      const data = res.data.data
      if (!data) {
        setError('Respons tidak valid dari server.')
        return
      }

      setActiveRole(data.token, data.active_role)
      Cookies.set('seapedia-token', data.token, { expires: 7, sameSite: 'lax' })
      Cookies.set('seapedia-role', data.active_role, { expires: 7, sameSite: 'lax' })

      router.push(`/${data.active_role.toLowerCase()}`)
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal mengganti peran. Silakan coba lagi.'
      setError(errorMsg)
    } finally {
      setLoading(null)
    }
  }

  return { switchToRole, loading, error, setError }
}
