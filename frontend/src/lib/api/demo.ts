import client from './client'
import type { ApiResponse } from '@/types'

export interface DemoSeller {
  email: string
  username: string
  store_name: string
}

export const getDemoSellers = () =>
  client.get<ApiResponse<DemoSeller[]>>('/demo/sellers')
