import { useBuyerStore } from '@/stores/useBuyerStore'
import { useCartStore } from '@/stores/useCartStore'
import { usePublicStore } from '@/stores/usePublicStore'
import { useSellerStore } from '@/stores/useSellerStore'
import { useAdminStore } from '@/stores/useAdminStore'
import { useDriverStore } from '@/stores/useDriverStore'

/** Reset semua data API saat logout / ganti user. */
export function resetAllStores() {
  useBuyerStore.getState().reset()
  useCartStore.getState().reset()
  usePublicStore.getState().reset()
  useSellerStore.getState().reset()
  useAdminStore.getState().reset()
  useDriverStore.getState().reset()
}
