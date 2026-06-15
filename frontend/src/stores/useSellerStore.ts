'use client'

import { create } from 'zustand'
import { sellerListProducts } from '@/lib/api/products'
import { sellerIncome, sellerOrderById, sellerOrders } from '@/lib/api/orders'
import { sellerGetStore } from '@/lib/api/stores'
import type { Order, OrderStatus, PaginatedData, Product, SellerIncome, Store } from '@/types'

interface SellerState {
  store: Store | null
  storeLoading: boolean

  products: PaginatedData<Product> | null
  productsLoading: boolean

  orders: PaginatedData<Order> | null
  ordersLoading: boolean

  orderDetail: Order | null
  orderDetailLoading: boolean

  income: PaginatedData<SellerIncome> | null
  incomeLoading: boolean

  fetchStore: () => Promise<void>
  fetchProducts: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchOrders: (params?: { page?: number; limit?: number; status?: OrderStatus }) => Promise<void>
  fetchOrderDetail: (id: string) => Promise<void>
  fetchIncome: (params?: { page?: number; limit?: number }) => Promise<void>
  reset: () => void
}

const emptySeller = {
  store: null as Store | null,
  storeLoading: false,
  products: null as PaginatedData<Product> | null,
  productsLoading: false,
  orders: null as PaginatedData<Order> | null,
  ordersLoading: false,
  orderDetail: null as Order | null,
  orderDetailLoading: false,
  income: null as PaginatedData<SellerIncome> | null,
  incomeLoading: false,
}

export const useSellerStore = create<SellerState>((set) => ({
  ...emptySeller,

  fetchStore: async () => {
    set({ storeLoading: true })
    try {
      const res = await sellerGetStore()
      set({ store: res.data.data ?? null, storeLoading: false })
    } catch {
      set({ store: null, storeLoading: false })
    }
  },

  fetchProducts: async (params) => {
    set({ productsLoading: true })
    try {
      const res = await sellerListProducts(params)
      set({ products: res.data.data ?? null, productsLoading: false })
    } catch {
      set({ products: null, productsLoading: false })
    }
  },

  fetchOrders: async (params) => {
    set({ ordersLoading: true })
    try {
      const res = await sellerOrders(params)
      set({ orders: res.data.data ?? null, ordersLoading: false })
    } catch {
      set({ orders: null, ordersLoading: false })
    }
  },

  fetchOrderDetail: async (id) => {
    set({ orderDetailLoading: true, orderDetail: null })
    try {
      const res = await sellerOrderById(id)
      set({ orderDetail: res.data.data ?? null, orderDetailLoading: false })
    } catch {
      set({ orderDetail: null, orderDetailLoading: false })
    }
  },

  fetchIncome: async (params) => {
    set({ incomeLoading: true })
    try {
      const res = await sellerIncome(params)
      set({ income: res.data.data ?? null, incomeLoading: false })
    } catch {
      set({ income: null, incomeLoading: false })
    }
  },

  reset: () => set(emptySeller),
}))
