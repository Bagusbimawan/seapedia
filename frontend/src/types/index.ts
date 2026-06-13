export interface User {
  id: string
  username: string
  email: string
  phone?: string
  roles: Role[]
}

export type Role = 'ADMIN' | 'SELLER' | 'BUYER' | 'DRIVER' | 'PENDING'

export type OrderStatus =
  | 'SEDANG_DIKEMAS'
  | 'MENUNGGU_PENGIRIM'
  | 'SEDANG_DIKIRIM'
  | 'PESANAN_SELESAI'
  | 'DIKEMBALIKAN'

export type DeliveryMethod = 'INSTANT' | 'NEXT_DAY' | 'REGULAR'
export type DiscountType = 'PERCENT' | 'FIXED'
export type WalletTxType = 'TOPUP' | 'PAYMENT' | 'REFUND'

export interface Product {
  id: string
  store_id: string
  name: string
  description?: string
  price: number
  stock: number
  created_at: string
}

export interface Store {
  id: string
  seller_user_id: string
  name: string
  description?: string
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: WalletTxType
  amount: number
  balance_after: number
  ref_order_id?: string
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string
  street: string
  city: string
  zip_code: string
  is_default: boolean
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
}

export interface Cart {
  id: string
  user_id: string
  store_id?: string
  items: CartItem[]
}

export interface OrderItem {
  id?: string
  order_id?: string
  product_id: string
  name_snapshot: string
  price_snapshot: number
  quantity: number
}

export interface Order {
  id: string
  buyer_user_id: string
  store_id: string
  delivery_method: DeliveryMethod
  subtotal: number
  discount_amount: number
  tax_amount: number
  delivery_fee: number
  total: number
  status: OrderStatus
  deadline_at: string
  created_at: string
  items: OrderItem[]
}

export interface Discount {
  id: string
  code: string
  kind: 'VOUCHER' | 'PROMO'
  discount_type: DiscountType
  discount_value: number
  expiry_date: string
  remaining_usage?: number
}

export interface DeliveryJob {
  id: string
  order_id: string
  driver_user_id?: string
  earning_amount: number
  taken_at?: string
  completed_at?: string
  created_at: string
}

export interface AppReview {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
}

export interface SellerIncome {
  id: string
  store_id: string
  order_id: string
  type: 'INCOME' | 'REVERSAL'
  amount: number
  created_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface CheckoutRequest {
  address_id: string
  delivery_method: DeliveryMethod
  discount_code?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  phone?: string
  password: string
  roles: Role[]
}

export interface LoginResponse {
  token: string
  user: User
  active_role: Role
  needs_role_select: boolean
}

export interface SwitchRoleResponse {
  token: string
  active_role: Role
}
