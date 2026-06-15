'use client'

import { create } from 'zustand'
import { listAddresses } from '@/lib/api/addresses'
import { buyerOrderById, buyerOrders } from '@/lib/api/orders'
import { getBalance, getTransactions } from '@/lib/api/wallet'
import type { Address, Order, PaginatedData, Wallet, WalletTransaction } from '@/types'

interface BuyerState {
  wallet: Wallet | null
  walletLoading: boolean
  walletError: boolean

  transactions: PaginatedData<WalletTransaction> | null
  transactionsLoading: boolean

  orders: PaginatedData<Order> | null
  ordersLoading: boolean
  ordersError: boolean

  orderDetail: Order | null
  orderDetailLoading: boolean
  orderDetailError: boolean

  addresses: Address[]
  addressesLoading: boolean
  addressesError: boolean

  fetchWallet: () => Promise<void>
  setWallet: (wallet: Wallet) => void
  fetchTransactions: (limit?: number) => Promise<void>
  fetchOrders: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchOrderDetail: (id: string) => Promise<void>
  fetchAddresses: () => Promise<void>
  reset: () => void
}

const emptyBuyer = {
  wallet: null as Wallet | null,
  walletLoading: false,
  walletError: false,
  transactions: null as PaginatedData<WalletTransaction> | null,
  transactionsLoading: false,
  orders: null as PaginatedData<Order> | null,
  ordersLoading: false,
  ordersError: false,
  orderDetail: null as Order | null,
  orderDetailLoading: false,
  orderDetailError: false,
  addresses: [] as Address[],
  addressesLoading: false,
  addressesError: false,
}

export const useBuyerStore = create<BuyerState>((set) => ({
  ...emptyBuyer,

  fetchWallet: async () => {
    set({ walletLoading: true, walletError: false })
    try {
      const res = await getBalance()
      set({ wallet: res.data.data ?? null, walletLoading: false })
    } catch {
      set({ wallet: null, walletLoading: false, walletError: true })
    }
  },

  setWallet: (wallet) => set({ wallet, walletError: false }),

  fetchTransactions: async (limit = 50) => {
    set({ transactionsLoading: true })
    try {
      const res = await getTransactions({ limit })
      set({ transactions: res.data.data ?? null, transactionsLoading: false })
    } catch {
      set({ transactions: null, transactionsLoading: false })
    }
  },

  fetchOrders: async (params) => {
    set({ ordersLoading: true, ordersError: false })
    try {
      const res = await buyerOrders(params)
      set({ orders: res.data.data ?? null, ordersLoading: false })
    } catch {
      set({ orders: null, ordersLoading: false, ordersError: true })
    }
  },

  fetchOrderDetail: async (id) => {
    set({ orderDetailLoading: true, orderDetailError: false, orderDetail: null })
    try {
      const res = await buyerOrderById(id)
      set({ orderDetail: res.data.data ?? null, orderDetailLoading: false })
    } catch {
      set({ orderDetail: null, orderDetailLoading: false, orderDetailError: true })
    }
  },

  fetchAddresses: async () => {
    set({ addressesLoading: true, addressesError: false })
    try {
      const res = await listAddresses()
      set({ addresses: res.data.data ?? [], addressesLoading: false })
    } catch {
      set({ addresses: [], addressesLoading: false, addressesError: true })
    }
  },

  reset: () => set(emptyBuyer),
}))
