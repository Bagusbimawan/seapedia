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

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isError: false,

  fetchCart: async () => {
    set({ isLoading: true, isError: false })
    try {
      const res = await getCart()
      set({ cart: res.data.data ?? null, isLoading: false, isError: false })
    } catch {
      const existing = get().cart
      const hasItems = (existing?.items?.length ?? 0) > 0
      set({
        isLoading: false,
        isError: !hasItems,
        // Jangan hapus cart yang sudah di-set dari addItem jika refetch gagal
      })
    }
  },

  setCart: (cart) => set({ cart, isError: false, isLoading: false }),

  reset: () => set({ cart: null, isLoading: false, isError: false }),
}))
