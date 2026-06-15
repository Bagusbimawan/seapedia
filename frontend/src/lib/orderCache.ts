import type { QueryClient } from '@tanstack/react-query'
import { getScopedQueryKey } from '@/lib/queryKeys'

export async function refreshBuyerOrdersCache(queryClient: QueryClient) {
  const ordersPrefix = getScopedQueryKey('buyer-orders')
  const summaryKey = getScopedQueryKey('buyer-orders-summary')
  await queryClient.invalidateQueries({ queryKey: ordersPrefix })
  await queryClient.invalidateQueries({ queryKey: summaryKey })
  await queryClient.refetchQueries({ queryKey: ordersPrefix })
  await queryClient.refetchQueries({ queryKey: summaryKey })
}
