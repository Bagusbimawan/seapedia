'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCart } from '@/lib/api/cart'
import { refreshBuyerCartCache, syncBuyerCartCache } from '@/lib/cartCache'
import { useScopedQueryKey } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Cart, CartItem } from '@/types'

export interface CartLineItem {
  product_id: string
  quantity: number
  name: string
  price: number
  stock: number
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
    lineTotal: price * item.quantity,
  }
}

export function useBuyerCart() {
  const queryClient = useQueryClient()
  const authReady = useAuthStore((s) => s.hasHydrated && !!s.token)
  const cartKey = useScopedQueryKey('buyer-cart')

  const cartQuery = useQuery({
    queryKey: cartKey,
    queryFn: async () => (await getCart()).data.data as Cart | undefined,
    enabled: authReady,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
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
    queryClient.setQueryData(cartKey, (old: Cart | undefined) =>
      old ? { ...old, items: [], store_id: undefined } : old
    )
    void refreshBuyerCartCache(queryClient)
  }

  const refreshCart = async () => {
    await refreshBuyerCartCache(queryClient)
  }

  const hasItems = (cartQuery.data?.items?.length ?? 0) > 0
  const isLoading = cartQuery.isLoading || (cartQuery.isFetching && !hasItems)

  return {
    cart: cartQuery.data,
    lineItems,
    subtotal,
    isLoading,
    isFetching: cartQuery.isFetching,
    isEmpty: !isLoading && !cartQuery.isFetching && !hasItems,
    isReady: !isLoading && hasItems,
    isError: cartQuery.isError,
    error: cartQuery.error,
    clearCartCache,
    refreshCart,
    syncCart: (cart: Cart | undefined) => syncBuyerCartCache(queryClient, cart),
  }
}
