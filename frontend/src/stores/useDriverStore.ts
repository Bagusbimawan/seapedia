'use client'

import { create } from 'zustand'
import { listAvailableJobs, jobHistory } from '@/lib/api/delivery'
import type { DeliveryJob, PaginatedData } from '@/types'

interface DriverState {
  jobs: PaginatedData<DeliveryJob> | null
  jobsLoading: boolean

  history: PaginatedData<DeliveryJob> | null
  historyLoading: boolean

  fetchJobs: (params?: { page?: number; limit?: number }) => Promise<void>
  fetchHistory: (params?: { page?: number; limit?: number }) => Promise<void>
  reset: () => void
}

const emptyDriver = {
  jobs: null as PaginatedData<DeliveryJob> | null,
  jobsLoading: false,
  history: null as PaginatedData<DeliveryJob> | null,
  historyLoading: false,
}

export const useDriverStore = create<DriverState>((set) => ({
  ...emptyDriver,

  fetchJobs: async (params) => {
    set({ jobsLoading: true })
    try {
      const res = await listAvailableJobs(params)
      set({ jobs: res.data.data ?? null, jobsLoading: false })
    } catch {
      set({ jobs: null, jobsLoading: false })
    }
  },

  fetchHistory: async (params) => {
    set({ historyLoading: true })
    try {
      const res = await jobHistory(params)
      set({ history: res.data.data ?? null, historyLoading: false })
    } catch {
      set({ history: null, historyLoading: false })
    }
  },

  reset: () => set(emptyDriver),
}))
