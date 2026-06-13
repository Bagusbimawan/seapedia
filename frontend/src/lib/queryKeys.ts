import { useAuthStore } from '@/stores/useAuthStore'

/** Scope query cache per logged-in user so switching accounts never shows stale data. */
export function useScopedQueryKey(...parts: readonly unknown[]) {
  const userId = useAuthStore((state) => state.user?.id ?? 'anon')
  return [...parts, userId] as const
}

export function getScopedQueryKey(...parts: readonly unknown[]) {
  const userId = useAuthStore.getState().user?.id ?? 'anon'
  return [...parts, userId] as const
}
