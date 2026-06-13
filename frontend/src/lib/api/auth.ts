import client from './client'
import type { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, Role, SwitchRoleResponse, User } from '@/types'

export const register = (data: RegisterRequest) =>
  client.post<ApiResponse<User>>('/auth/register', data)

export const login = (data: LoginRequest) =>
  client.post<ApiResponse<LoginResponse>>('/auth/login', data)

export const switchRole = (role: Role) =>
  client.post<ApiResponse<SwitchRoleResponse>>('/auth/switch-role', { role })

export const getMe = () =>
  client.get<ApiResponse<User>>('/auth/me')
