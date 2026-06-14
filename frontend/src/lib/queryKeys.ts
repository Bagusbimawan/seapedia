import { useAuthStore } from '@/stores/useAuthStore'
import { getUserIdFromToken } from '@/lib/authSession'

/** Scope query cache per JWT user_id so switching accounts never shows stale data. */
export function useScopedQueryKey(...parts: readonly unknown[]) {
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const userId = hasHydrated ? getUserIdFromToken(token) : 'pending'
  return [...parts, userId] as const
}

export function getScopedQueryKey(...parts: readonly unknown[]) {
  const { token, hasHydrated } = useAuthStore.getState()
  const userId = hasHydrated ? getUserIdFromToken(token) : 'pending'
  return [...parts, userId] as const
}
