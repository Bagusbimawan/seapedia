import client from './client'
import type { ApiResponse, DeliveryJob, PaginatedData } from '@/types'

export interface JobListParams {
  page?: number
  limit?: number
}

// Driver endpoints (require Bearer token)
export const listAvailableJobs = (params?: JobListParams) =>
  client.get<ApiResponse<PaginatedData<DeliveryJob>>>('/driver/jobs', { params })

export const takeJob = (id: string) =>
  client.post<ApiResponse<DeliveryJob>>(`/driver/jobs/${id}/take`, {})

export const completeJob = (id: string) =>
  client.post<ApiResponse<DeliveryJob>>(`/driver/jobs/${id}/complete`, {})

export const jobHistory = (params?: JobListParams) =>
  client.get<ApiResponse<PaginatedData<DeliveryJob>>>('/driver/jobs/history', { params })
