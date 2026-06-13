import client from './client'
import type { Address, ApiResponse } from '@/types'

export interface CreateAddressRequest {
  label: string
  street: string
  city: string
  zip_code: string
  is_default?: boolean
}

export type UpdateAddressRequest = Omit<CreateAddressRequest, 'is_default'>

export const listAddresses = () =>
  client.get<ApiResponse<Address[]>>('/buyer/addresses')

export const createAddress = (data: CreateAddressRequest) =>
  client.post<ApiResponse<Address>>('/buyer/addresses', data)

export const updateAddress = (id: string, data: UpdateAddressRequest) =>
  client.put<ApiResponse<Address>>(`/buyer/addresses/${id}`, data)

export const deleteAddress = (id: string) =>
  client.delete(`/buyer/addresses/${id}`)

export const setDefaultAddress = (id: string) =>
  client.post<ApiResponse<{ message: string }>>(`/buyer/addresses/${id}/set-default`)
