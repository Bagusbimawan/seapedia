import client from './client'
import type { ApiResponse, Cart } from '@/types'

export interface AddCartItemRequest {
  product_id: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export const getCart = () =>
  client.get<ApiResponse<Cart>>('/buyer/cart')

export const addItem = (data: AddCartItemRequest) =>
  client.post<ApiResponse<Cart>>('/buyer/cart/items', data)

export const updateItem = (productId: string, data: UpdateCartItemRequest) =>
  client.put<ApiResponse<Cart>>(`/buyer/cart/items/${productId}`, data)

export const removeItem = (productId: string) =>
  client.delete<ApiResponse<Cart>>(`/buyer/cart/items/${productId}`)

export const clearCart = () =>
  client.delete<ApiResponse<null>>('/buyer/cart')
