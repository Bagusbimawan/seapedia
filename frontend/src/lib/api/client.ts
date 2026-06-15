import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'
import { clearSession, logoutAndRedirect } from '@/lib/authSession'
import { useAuthStore } from '@/stores/useAuthStore'

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request interceptor: inject Bearer token from zustand store
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      useAuthStore.getState().token ||
      (typeof window !== 'undefined' ? Cookies.get('seapedia-token') : undefined)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 → clear auth + redirect
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      logoutAndRedirect()
    }

    return Promise.reject(error)
  }
)

export default client
