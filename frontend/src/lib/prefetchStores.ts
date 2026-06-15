import { useAdminStore } from '@/stores/useAdminStore'
import { useBuyerStore } from '@/stores/useBuyerStore'
import { useCartStore } from '@/stores/useCartStore'
import { useDriverStore } from '@/stores/useDriverStore'
import { useSellerStore } from '@/stores/useSellerStore'
import type { Role } from '@/types'

/** Muat ulang data role setelah login / ganti user. */
export function prefetchForRole(role: Role) {
  switch (role) {
    case 'BUYER':
      void useBuyerStore.getState().fetchWallet()
      void useBuyerStore.getState().fetchTransactions()
      void useBuyerStore.getState().fetchOrders({ limit: 20 })
      void useBuyerStore.getState().fetchAddresses()
      void useCartStore.getState().fetchCart()
      break
    case 'SELLER':
      void useSellerStore.getState().fetchStore()
      void useSellerStore.getState().fetchProducts({ limit: 50 })
      void useSellerStore.getState().fetchOrders({ limit: 20 })
      break
    case 'DRIVER':
      void useDriverStore.getState().fetchJobs({ limit: 20 })
      break
    case 'ADMIN':
      void useAdminStore.getState().fetchUsers({ limit: 50 })
      void useAdminStore.getState().fetchStores({ limit: 50 })
      void useAdminStore.getState().fetchOrders({ limit: 50 })
      break
    default:
      break
  }
}
