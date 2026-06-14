import { useAuthStore } from '@/stores/useAuthStore'
import type { Role } from '@/types'

export function useAuth() {
  const store = useAuthStore()

  return {
    ...store,
    isReady: store.hasHydrated && !!store.token,
    isRole: (r: Role) => store.activeRole === r,
  }
}
