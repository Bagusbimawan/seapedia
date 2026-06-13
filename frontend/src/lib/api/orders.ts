import client from './client'
import type { ApiResponse, CheckoutRequest, Order, OrderStatus, PaginatedData, SellerIncome } from '@/types'

export interface OrderListParams {
  status?: OrderStatus
  page?: number
  limit?: number
}

// Buyer endpoints
export const checkout = (data: CheckoutRequest) =>
  client.post<ApiResponse<Order>>('/buyer/checkout', data)

export const buyerOrders = (params?: OrderListParams) =>
  client.get<ApiResponse<PaginatedData<Order>>>('/buyer/orders', { params })

export const buyerOrderById = (id: string) =>
  client.get<ApiResponse<Order>>(`/buyer/orders/${id}`)

// Seller endpoints
export const sellerOrders = (params?: OrderListParams) =>
  client.get<ApiResponse<PaginatedData<Order>>>('/seller/orders', { params })

export const sellerOrderById = (id: string) =>
  client.get<ApiResponse<Order>>(`/seller/orders/${id}`)

export const markReady = (id: string) =>
  client.post<ApiResponse<Order>>(`/seller/orders/${id}/ready`, {})

export const sellerIncome = (params?: OrderListParams) =>
  client.get<ApiResponse<PaginatedData<SellerIncome>>>('/seller/income', { params })
