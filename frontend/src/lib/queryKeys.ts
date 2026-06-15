import { useAuthStore } from '@/stores/useAuthStore'
import { getUserIdFromToken } from '@/lib/authSession'

/** Resolve stable user id for React Query — prefer JWT even before zustand hydration. */
export function resolveQueryUserId(token: string | null | undefined, hasHydrated: boolean): string {
  const fromToken = getUserIdFromToken(token)
  if (fromToken !== 'anon') return fromToken
  return hasHydrated ? 'anon' : 'pending'
}

/**
 * Scoped query key: [namespace, userId, ...params]
 * userId di posisi kedua agar invalidateQueries({ queryKey: [namespace, userId] })
 * juga memuat semua halaman/varian (mis. buyer-orders halaman 1, 2, …).
 */
export function useScopedQueryKey(...parts: readonly unknown[]) {
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const userId = resolveQueryUserId(token, hasHydrated)
  if (parts.length === 0) return [userId] as const
  return [parts[0], userId, ...parts.slice(1)] as const
}

export function getScopedQueryKey(...parts: readonly unknown[]) {
  const { token, hasHydrated } = useAuthStore.getState()
  const userId = resolveQueryUserId(token, hasHydrated)
  if (parts.length === 0) return [userId] as const
  return [parts[0], userId, ...parts.slice(1)] as const
}
