import client from './client'
import type { ApiResponse, PaginatedData, Wallet, WalletTransaction } from '@/types'

export interface TopupRequest {
  amount: number
}

export interface WalletTxParams {
  page?: number
  limit?: number
}

export const getBalance = () =>
  client.get<ApiResponse<Wallet>>('/buyer/wallet')

export const topup = (data: TopupRequest) =>
  client.post<ApiResponse<Wallet>>('/buyer/wallet/topup', data)

export const getTransactions = (params?: WalletTxParams) =>
  client.get<ApiResponse<PaginatedData<WalletTransaction>>>('/buyer/wallet/transactions', { params })
