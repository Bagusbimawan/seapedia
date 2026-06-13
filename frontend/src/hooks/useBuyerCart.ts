'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCart } from '@/lib/api/cart'
import { getProductById } from '@/lib/api/products'
import { getScopedQueryKey, useScopedQueryKey } from '@/lib/queryKeys'
import type { Cart, Product } from '@/types'

export interface CartLineItem {
  product_id: string
  quantity: number
  product?: Product
  lineTotal: number
}

export function useBuyerCart() {
  const queryClient = useQueryClient()
  const cartKey = useScopedQueryKey('buyer-cart')

  const cartQuery = useQuery({
    queryKey: cartKey,
    queryFn: async () => (await getCart()).data.data as Cart | undefined,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const productIds = cartQuery.data?.items?.map((i) => i.product_id) ?? []
  const productsKey = useScopedQueryKey('cart-products', productIds)

  const productsQuery = useQuery({
    queryKey: productsKey,
    enabled: productIds.length > 0,
    queryFn: async () => {
      const map = new Map<string, Product>()
      const results = await Promise.all(
        productIds.map(async (id) => {
          try {
            const res = await getProductById(id)
            if (res.data.data) return { id, product: res.data.data }
          } catch {
            return null
          }
          return null
        })
      )
      for (const r of results) {
        if (r) map.set(r.id, r.product)
      }
      return map
    },
    staleTime: 0,
  })

  const lineItems: CartLineItem[] = useMemo(() => {
    if (!cartQuery.data?.items) return []
    return cartQuery.data.items.map((item) => {
      const product = productsQuery.data?.get(item.product_id)
      const price = product?.price ?? 0
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        product,
        lineTotal: price * item.quantity,
      }
    })
  }, [cartQuery.data?.items, productsQuery.data])

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  )

  const clearCartCache = () => {
    queryClient.setQueryData(cartKey, (old: Cart | undefined) =>
      old ? { ...old, items: [], store_id: undefined } : old
    )
    queryClient.invalidateQueries({ queryKey: cartKey })
    queryClient.invalidateQueries({ queryKey: productsKey })
  }

  const refreshCart = async () => {
    await cartQuery.refetch()
    if (productIds.length > 0) await productsQuery.refetch()
  }

  return {
    cart: cartQuery.data,
    products: productsQuery.data,
    lineItems,
    subtotal,
    isLoading: cartQuery.isLoading || (productIds.length > 0 && productsQuery.isLoading),
    isFetching: cartQuery.isFetching || productsQuery.isFetching,
    isEmpty: !cartQuery.isLoading && (!cartQuery.data?.items?.length),
    isReady: !cartQuery.isLoading && (!productIds.length || !productsQuery.isLoading),
    clearCartCache,
    refreshCart,
  }
}
