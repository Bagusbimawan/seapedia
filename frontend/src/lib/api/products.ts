import client from './client'
import type { ApiResponse, PaginatedData, Product } from '@/types'

export interface ProductListParams {
  search?: string
  page?: number
  limit?: number
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  stock: number
}

export type UpdateProductRequest = Partial<CreateProductRequest>

// Public endpoints
export const listProducts = (params?: ProductListParams) =>
  client.get<ApiResponse<PaginatedData<Product>>>('/products', { params })

export const getProductById = (id: string) =>
  client.get<ApiResponse<Product>>(`/products/${id}`)

// Seller endpoints (require Bearer token)
export const sellerListProducts = (params?: ProductListParams) =>
  client.get<ApiResponse<PaginatedData<Product>>>('/seller/products', { params })

export const sellerCreateProduct = (data: CreateProductRequest) =>
  client.post<ApiResponse<Product>>('/seller/products', data)

export const sellerUpdateProduct = (id: string, data: UpdateProductRequest) =>
  client.put<ApiResponse<Product>>(`/seller/products/${id}`, data)

export const sellerDeleteProduct = (id: string) =>
  client.delete<ApiResponse<null>>(`/seller/products/${id}`)
