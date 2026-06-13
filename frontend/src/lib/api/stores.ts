import client from './client'
import type { ApiResponse, Store } from '@/types'

export interface StoreUpsertRequest {
  name: string
  description?: string
}

// Public endpoint
export const getStoreById = (id: string) =>
  client.get<ApiResponse<Store>>(`/stores/${id}`)

// Seller endpoints (require Bearer token)
export const sellerGetStore = () =>
  client.get<ApiResponse<Store>>('/seller/store')

export const sellerCreateStore = (data: StoreUpsertRequest) =>
  client.post<ApiResponse<Store>>('/seller/store', data)

export const sellerUpdateStore = (data: StoreUpsertRequest) =>
  client.put<ApiResponse<Store>>('/seller/store', data)
