'use client'

import { create } from 'zustand'
import { listUsers, listStores, listOrders } from '@/lib/api/admin'
import { listPromos, listVouchers } from '@/lib/api/discounts'
import type { Discount, Order, PaginatedData, Store, User } from '@/types'

interface AdminState {
  users: PaginatedData<User> | null
  usersLoading: boolean

  stores: PaginatedData<Store> | null
  storesLoading: boolean

  orders: PaginatedData<Order> | null
  ordersLoading: boolean

  vouchers: PaginatedData<Discount> | null
  vouchersLoading: boolean

  promos: PaginatedData<Discount> | null
  promosLoading: boolean

  fetchUsers: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchStores: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchOrders: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchVouchers: () => Promise<void>
  fetchPromos: () => Promise<void>
  reset: () => void
}

const emptyAdmin = {
  users: null as PaginatedData<User> | null,
  usersLoading: false,
  stores: null as PaginatedData<Store> | null,
  storesLoading: false,
  orders: null as PaginatedData<Order> | null,
  ordersLoading: false,
  vouchers: null as PaginatedData<Discount> | null,
  vouchersLoading: false,
  promos: null as PaginatedData<Discount> | null,
  promosLoading: false,
}

export const useAdminStore = create<AdminState>((set) => ({
  ...emptyAdmin,

  fetchUsers: async (params) => {
    set({ usersLoading: true })
    try {
      const res = await listUsers(params)
      set({ users: res.data.data ?? null, usersLoading: false })
    } catch {
      set({ users: null, usersLoading: false })
    }
  },

  fetchStores: async (params) => {
    set({ storesLoading: true })
    try {
      const res = await listStores(params)
      set({ stores: res.data.data ?? null, storesLoading: false })
    } catch {
      set({ stores: null, storesLoading: false })
    }
  },

  fetchOrders: async (params) => {
    set({ ordersLoading: true })
    try {
      const res = await listOrders(params)
      set({ orders: res.data.data ?? null, ordersLoading: false })
    } catch {
      set({ orders: null, ordersLoading: false })
    }
  },

  fetchVouchers: async () => {
    set({ vouchersLoading: true })
    try {
      const res = await listVouchers({ limit: 20 })
      set({ vouchers: res.data.data ?? null, vouchersLoading: false })
    } catch {
      set({ vouchers: null, vouchersLoading: false })
    }
  },

  fetchPromos: async () => {
    set({ promosLoading: true })
    try {
      const res = await listPromos({ limit: 20 })
      set({ promos: res.data.data ?? null, promosLoading: false })
    } catch {
      set({ promos: null, promosLoading: false })
    }
  },

  reset: () => set(emptyAdmin),
}))
