'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCart } from '@/lib/api/cart'
import { cachedQueryOptions } from '@/lib/queryConfig'
import { refreshBuyerCartCache, syncBuyerCartCache } from '@/lib/cartCache'
import { shouldShowQuerySkeleton } from '@/lib/queryLoading'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Cart, CartItem } from '@/types'

export interface CartLineItem {
  product_id: string
  quantity: number
  name: string
  price: number
  stock: number
  store_id?: string
  store_name?: string
  lineTotal: number
}

function toLineItem(item: CartItem): CartLineItem {
  const price = item.price ?? 0
  return {
    product_id: item.product_id,
    quantity: item.quantity,
    name: item.name ?? item.product_id,
    price,
    stock: item.stock ?? 0,
    store_id: item.store_id,
    store_name: item.store_name,
    lineTotal: price * item.quantity,
  }
}

export function useBuyerCart() {
  const queryClient = useQueryClient()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const authReady = useAuthStore((s) => s.hasHydrated && !!s.token)
  const cartKey = useScopedQueryKey('buyer-cart')

  const cartQuery = useQuery({
    queryKey: cartKey,
    queryFn: async () => (await getCart()).data.data as Cart | undefined,
    enabled: authReady,
    ...cachedQueryOptions,
  })

  const lineItems: CartLineItem[] = useMemo(() => {
    if (!cartQuery.data?.items?.length) return []
    return cartQuery.data.items.map(toLineItem)
  }, [cartQuery.data?.items])

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  )

  const clearCartCache = () => {
    queryClient.setQueryData(cartKey, { id: '', user_id: '', items: [] } satisfies Cart)
    void refreshBuyerCartCache(queryClient)
  }

  const refreshCart = async () => {
    await refreshBuyerCartCache(queryClient)
  }

  const hasItems = lineItems.length > 0
  const isLoading = !hasHydrated || shouldShowQuerySkeleton(authReady, cartQuery)

  return {
    cart: cartQuery.data,
    lineItems,
    subtotal,
    isLoading,
    isFetching: cartQuery.isFetching,
    isEmpty: authReady && !isLoading && !cartQuery.isError && !hasItems,
    isReady: hasItems,
    isError: cartQuery.isError,
    error: cartQuery.error,
    clearCartCache,
    refreshCart,
    syncCart: (cart: Cart | undefined) => syncBuyerCartCache(queryClient, cart),
  }
}
