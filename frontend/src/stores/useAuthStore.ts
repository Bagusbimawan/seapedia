import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Role } from '@/types'

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
