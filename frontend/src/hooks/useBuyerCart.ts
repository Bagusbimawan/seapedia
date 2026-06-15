'use client'

import { useEffect, useMemo } from 'react'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import type { CartItem } from '@/types'

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
  const { ready, userId } = useAuthReady()
  const cart = useCartStore((s) => s.cart)
  const isLoading = useCartStore((s) => s.isLoading)
  const isError = useCartStore((s) => s.isError)
  const fetchCart = useCartStore((s) => s.fetchCart)
  const setCart = useCartStore((s) => s.setCart)

  useEffect(() => {
    if (!ready) return
    void fetchCart()
  }, [ready, userId, fetchCart])

  const lineItems: CartLineItem[] = useMemo(() => {
    if (!cart?.items?.length) return []
    return cart.items.map(toLineItem)
  }, [cart?.items])

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  )

  const hasItems = lineItems.length > 0
  const showLoading = !hasItems && (!ready || isLoading)

  return {
    cart: cart ?? undefined,
    lineItems,
    subtotal,
    isLoading: showLoading,
    isFetching: isLoading,
    isEmpty: ready && !showLoading && !isError && !hasItems,
    isReady: hasItems,
    isError: ready && isError && !hasItems,
    clearCartCache: () => setCart({ id: '', user_id: '', items: [] }),
    refreshCart: fetchCart,
    syncCart: (next: Parameters<typeof setCart>[0]) => setCart(next ?? null),
  }
}
