import { useAuthStore } from '@/stores/useAuthStore'
import type { Role } from '@/types'

export function useAuth() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const activeRole = useAuthStore((s) => s.activeRole)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  return {
    token,
    user,
    activeRole,
    isAuthenticated,
    hasHydrated,
    isReady: hasHydrated && !!token,
    isRole: (r: Role) => activeRole === r,
  }
}
