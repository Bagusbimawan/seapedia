'use client'

import { create } from 'zustand'
import { getDemoSellers, type DemoSeller } from '@/lib/api/demo'
import { listProducts } from '@/lib/api/products'
import { listReviews } from '@/lib/api/reviews'
import type { AppReview, PaginatedData, Product } from '@/types'

interface PublicState {
  products: PaginatedData<Product> | null
  productsLoading: boolean
  productsError: boolean

  reviews: PaginatedData<AppReview> | null
  reviewsLoading: boolean

  demoSellers: DemoSeller[]
  demoSellersLoading: boolean

  fetchProducts: (params: { search?: string; page?: number; limit?: number }) => Promise<void>
  fetchReviews: () => Promise<void>
  fetchDemoSellers: () => Promise<void>
  reset: () => void
}

const emptyPublic = {
  products: null as PaginatedData<Product> | null,
  productsLoading: false,
  productsError: false,
  reviews: null as PaginatedData<AppReview> | null,
  reviewsLoading: false,
  demoSellers: [] as DemoSeller[],
  demoSellersLoading: false,
}

export const usePublicStore = create<PublicState>((set) => ({
  ...emptyPublic,

  fetchProducts: async (params) => {
    set({ productsLoading: true, productsError: false })
    try {
      const res = await listProducts(params)
      set({ products: res.data.data ?? null, productsLoading: false })
    } catch {
      set({ products: null, productsLoading: false, productsError: true })
    }
  },

  fetchReviews: async () => {
    set({ reviewsLoading: true })
    try {
      const res = await listReviews({ limit: 20 })
      set({ reviews: res.data.data ?? null, reviewsLoading: false })
    } catch {
      set({ reviews: null, reviewsLoading: false })
    }
  },

  fetchDemoSellers: async () => {
    set({ demoSellersLoading: true })
    try {
      const res = await getDemoSellers()
      set({ demoSellers: res.data.data ?? [], demoSellersLoading: false })
    } catch {
      set({ demoSellers: [], demoSellersLoading: false })
    }
  },

  reset: () => set(emptyPublic),
}))
