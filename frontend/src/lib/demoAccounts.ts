export interface DemoAccount {
  role: string
  email: string
  password: string
  note?: string
}

/** Akun demo tetap — tanpa multi-role, tanpa seller hardcode. */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin@seapedia.com', password: 'admin123' },
  { role: 'Buyer', email: 'buyer@seapedia.com', password: 'buyer123', note: 'Saldo Rp 500.000' },
  { role: 'Driver', email: 'driver@seapedia.com', password: 'driver123' },
]

/** Password untuk akun seed yang dikenal (termasuk seller@ dari seed). */
export const KNOWN_DEMO_PASSWORDS: Record<string, string> = {
  'admin@seapedia.com': 'admin123',
  'seller@seapedia.com': 'seller123',
  'buyer@seapedia.com': 'buyer123',
  'driver@seapedia.com': 'driver123',
}

export const DEMO_VOUCHER = { code: 'DISC20', desc: 'Diskon 20%' }
