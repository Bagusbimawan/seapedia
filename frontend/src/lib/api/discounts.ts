import client from './client'
import type { ApiResponse, Discount, DiscountType, PaginatedData } from '@/types'

export interface ValidateDiscountRequest {
  code: string
  subtotal: number
}

export interface ValidateDiscountResponse {
  discount: Discount
  discount_amount: number
}

export interface AdminCreateVoucherRequest {
  code: string
  discount_type: DiscountType
  discount_value: number
  expiry_date: string
  remaining_usage: number
}

export interface AdminCreatePromoRequest {
  code: string
  discount_type: DiscountType
  discount_value: number
  expiry_date: string
}

export interface DiscountListParams {
  page?: number
  limit?: number
}

// Public endpoints
export const listVouchers = (params?: DiscountListParams) =>
  client.get<ApiResponse<PaginatedData<Discount>>>('/vouchers', { params })

export const listPromos = (params?: DiscountListParams) =>
  client.get<ApiResponse<PaginatedData<Discount>>>('/promos', { params })

// Buyer endpoint
export const validate = (data: ValidateDiscountRequest) =>
  client.post<ApiResponse<ValidateDiscountResponse>>('/buyer/discount/validate', data)

// Admin endpoints
export const adminCreateVoucher = (data: AdminCreateVoucherRequest) =>
  client.post<ApiResponse<Discount>>('/admin/vouchers', data)

export const adminCreatePromo = (data: AdminCreatePromoRequest) =>
  client.post<ApiResponse<Discount>>('/admin/promos', data)
