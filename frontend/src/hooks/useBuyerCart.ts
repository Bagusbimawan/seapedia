'use client'

import { useEffect, useMemo } from 'react'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { getUserIdFromToken } from '@/lib/authSession'
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
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const token = useAuthStore((s) => s.token)
  const authReady = useAuthStore((s) => s.hasHydrated && !!s.token)
  const userId = useAuthStore((s) => s.user?.id) ?? getUserIdFromToken(token)
  const cart = useCartStore((s) => s.cart)
  const isLoading = useCartStore((s) => s.isLoading)
  const isError = useCartStore((s) => s.isError)
  const fetchCart = useCartStore((s) => s.fetchCart)
  const setCart = useCartStore((s) => s.setCart)

  useEffect(() => {
    if (!authReady || !userId || userId === 'anon') return
    void fetchCart()
  }, [authReady, userId, fetchCart])

  const lineItems: CartLineItem[] = useMemo(() => {
    if (!cart?.items?.length) return []
    return cart.items.map(toLineItem)
  }, [cart?.items])

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems]
  )

  const hasItems = lineItems.length > 0
  // Tampilkan item cache langsung; skeleton hanya bila belum ada data sama sekali
  const showLoading = !hasItems && (!hasHydrated || !authReady || isLoading)

  return {
    cart: cart ?? undefined,
    lineItems,
    subtotal,
    isLoading: showLoading,
    isFetching: isLoading,
    isEmpty: authReady && !showLoading && !isError && !hasItems,
    isReady: hasItems,
    isError: authReady && isError && !hasItems,
    clearCartCache: () => setCart({ id: '', user_id: '', items: [] }),
    refreshCart: fetchCart,
    syncCart: (next: Parameters<typeof setCart>[0]) => setCart(next ?? null),
  }
}
