import client from './client'
import type { ApiResponse, AppReview, PaginatedData } from '@/types'

export interface ReviewListParams {
  page?: number
  limit?: number
}

export interface CreateReviewRequest {
  reviewer_name: string
  rating: number
  comment: string
}

export const listReviews = (params?: ReviewListParams) =>
  client.get<ApiResponse<PaginatedData<AppReview>>>('/reviews', { params })

export const createReview = (data: CreateReviewRequest) =>
  client.post<ApiResponse<AppReview>>('/reviews', data)
