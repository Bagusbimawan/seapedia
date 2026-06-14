import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import { getQueryClient } from '@/lib/queryClient'
import type { Role, User } from '@/types'

const COOKIE_OPTS = { expires: 7, sameSite: 'lax' as const }

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

function setAuthCookies(token: string, role: Role) {
  Cookies.set('seapedia-token', token, COOKIE_OPTS)
  Cookies.set('seapedia-role', role, COOKIE_OPTS)
}

function clearAuthCookies() {
  Cookies.remove('seapedia-token')
  Cookies.remove('seapedia-role')
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
  const prevUserId = getUserIdFromToken(useAuthStore.getState().token)
  const nextUserId = user.id || getUserIdFromToken(token)

  useAuthStore.getState().setAuth(token, user, activeRole)
  setAuthCookies(token, activeRole)

  if (options?.forceClear || prevUserId !== nextUserId) {
    getQueryClient().clear()
  }
}

export function updateActiveRole(token: string, role: Role) {
  useAuthStore.getState().setActiveRole(token, role)
  setAuthCookies(token, role)
  getQueryClient().clear()
}

export function clearSession() {
  useAuthStore.getState().clearAuth()
  clearAuthCookies()
  getQueryClient().clear()
}
