import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import { resetAllStores } from '@/stores/resetStores'
import { prefetchForRole } from '@/lib/prefetchStores'
import type { Role, User } from '@/types'

const COOKIE_OPTS = { expires: 7, sameSite: 'lax' as const, path: '/' }

export function getUserIdFromToken(token: string | null | undefined): string {
  if (!token) return 'anon'
  try {
    const part = token.split('.')[1]
    if (!part) return 'anon'
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { user_id?: string; sub?: string }
    return payload.user_id ?? payload.sub ?? 'anon'
  } catch {
    return 'anon'
  }
}

export function getActiveRoleFromToken(token: string | null | undefined): Role | null {
  if (!token) return null
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { active_role?: string }
    return (payload.active_role as Role) ?? null
  } catch {
    return null
  }
}

function setAuthCookies(token: string, role: Role) {
  Cookies.set('seapedia-token', token, COOKIE_OPTS)
  Cookies.set('seapedia-role', role, COOKIE_OPTS)
}

function clearAuthCookies() {
  Cookies.remove('seapedia-token', { path: '/' })
  Cookies.remove('seapedia-role', { path: '/' })
}

function resetClientStores() {
  resetAllStores()
}

export async function fetchMeWithToken(token: string): Promise<User> {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'
  const res = await fetch(`${baseURL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  const body = await res.json()
  return body.data as User
}

export function establishSession(
  token: string,
  user: User,
  activeRole: Role,
  options?: { forceClear?: boolean }
) {
  const prevToken = useAuthStore.getState().token
  const prevUserId = getUserIdFromToken(prevToken)
  const nextUserId = user.id || getUserIdFromToken(token)

  useAuthStore.getState().setAuth(token, user, activeRole)
  setAuthCookies(token, activeRole)

  if (options?.forceClear || prevUserId !== nextUserId || prevToken !== token) {
    resetClientStores()
  }

  if (activeRole !== 'PENDING') {
    prefetchForRole(activeRole)
  }
}

export function updateActiveRole(token: string, role: Role) {
  useAuthStore.getState().setActiveRole(token, role)
  setAuthCookies(token, role)
  resetClientStores()
  prefetchForRole(role)
}

export function clearSession(options?: { redirect?: boolean }) {
  useAuthStore.getState().clearAuth()
  clearAuthCookies()
  resetClientStores()

  if (options?.redirect !== false && typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

export async function logoutAndRedirect() {
  const token = useAuthStore.getState().token
  if (token) {
    const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'
    try {
      await fetch(`${baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch {
      // Tetap logout lokal
    }
  }
  clearSession({ redirect: true })
}
