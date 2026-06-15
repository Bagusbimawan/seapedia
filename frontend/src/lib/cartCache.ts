import type { QueryClient } from '@tanstack/react-query'
import { getScopedQueryKey } from '@/lib/queryKeys'
import type { Cart } from '@/types'

export function syncBuyerCartCache(queryClient: QueryClient, cart: Cart | undefined) {
  if (!cart) return
  queryClient.setQueryData(getScopedQueryKey('buyer-cart'), cart)
}

export async function refreshBuyerCartCache(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: getScopedQueryKey('buyer-cart') })
  await queryClient.refetchQueries({ queryKey: getScopedQueryKey('buyer-cart') })
}
