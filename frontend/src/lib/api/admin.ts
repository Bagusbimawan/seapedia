import client from './client'
import type { ApiResponse, Order, OrderStatus, PaginatedData, Store, User } from '@/types'

export interface AdminListParams {
  page?: number
  limit?: number
}

export interface AdminOrderListParams extends AdminListParams {
  status?: OrderStatus
}

export const listUsers = (params?: AdminListParams) =>
  client.get<ApiResponse<PaginatedData<User>>>('/admin/users', { params })

export const listStores = (params?: AdminListParams) =>
  client.get<ApiResponse<PaginatedData<Store>>>('/admin/stores', { params })

export const listOrders = (params?: AdminOrderListParams) =>
  client.get<ApiResponse<PaginatedData<Order>>>('/admin/orders', { params })

export const advanceDay = () =>
  client.post<ApiResponse<{ offset_hours: number }>>('/admin/advance-day', {})

export interface AdminCreateStoreRequest {
  seller_user_id: string
  name: string
  description?: string
}

export const adminCreateStore = (data: AdminCreateStoreRequest) =>
  client.post<ApiResponse<Store>>('/admin/stores', data)
