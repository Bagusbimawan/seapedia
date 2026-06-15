import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User, Role } from '@/types'

const safeLocalStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(name)
      if (!raw) return null
      JSON.parse(raw)
      return raw
    } catch {
      localStorage.removeItem(name)
      return null
    }
  },
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
  },
}

interface AuthState {
  token: string | null
  user: User | null
  activeRole: Role | null
  isAuthenticated: boolean
  hasHydrated: boolean
  setAuth: (token: string, user: User, activeRole: Role) => void
  setActiveRole: (token: string, role: Role) => void
  clearAuth: () => void
  setHasHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeRole: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (token: string, user: User, activeRole: Role) => {
        set({ token, user, activeRole, isAuthenticated: true })
      },

      setActiveRole: (token: string, role: Role) => {
        set({ token, activeRole: role })
      },

      clearAuth: () => {
        set({ token: null, user: null, activeRole: null, isAuthenticated: false })
      },

      setHasHydrated: () => {
        set({ hasHydrated: true })
      },
    }),
    {
      name: 'seapedia-auth',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        activeRole: state.activeRole,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.getState().setHasHydrated()
      },
    }
  )
)
