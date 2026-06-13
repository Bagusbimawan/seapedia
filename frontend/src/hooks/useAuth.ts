import { useAuthStore } from '@/stores/useAuthStore'
import type { Role } from '@/types'

export function useAuth() {
  const store = useAuthStore()

  return {
    ...store,
    isRole: (r: Role) => store.activeRole === r,
  }
}
