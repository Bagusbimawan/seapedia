'use client'

import { create } from 'zustand'
import { getCart } from '@/lib/api/cart'
import type { Cart } from '@/types'

interface CartState {
  cart: Cart | null
  isLoading: boolean
  isError: boolean
  fetchCart: () => Promise<void>
  setCart: (cart: Cart | null) => void
  reset: () => void
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  isError: false,

  fetchCart: async () => {
    set({ isLoading: true, isError: false })
    try {
      const res = await getCart()
      set({ cart: res.data.data ?? null, isLoading: false })
    } catch {
      set({ cart: null, isLoading: false, isError: true })
    }
  },

  setCart: (cart) => set({ cart, isError: false }),

  reset: () => set({ cart: null, isLoading: false, isError: false }),
}))
