export function getApiError(err: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  const raw =
    (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback

  return translateApiError(raw)
}

const ERROR_MAP: Record<string, string> = {
  'order is not ready for pickup':
    'Pesanan belum siap diambil. Seller harus menekan "Siap Kirim" terlebih dahulu setelah selesai mengemas pesanan.',
  'order is not in SEDANG_DIKEMAS status':
    'Pesanan sudah tidak dalam status Sedang Dikemas. Refresh halaman untuk melihat status terbaru.',
  'order is not in delivery':
    'Pesanan tidak sedang dalam proses pengiriman.',
  'job already completed':
    'Pekerjaan pengiriman ini sudah diselesaikan.',
  'job already taken':
    'Pekerjaan ini sudah diambil driver lain.',
  'job does not belong to you':
    'Pekerjaan ini bukan milik Anda.',
  'insufficient balance':
    'Saldo dompet tidak mencukupi. Silakan top up terlebih dahulu.',
  'insufficient wallet balance':
    'Saldo dompet tidak mencukupi. Silakan top up terlebih dahulu.',
  'cart is empty':
    'Keranjang belanja kosong. Silakan tambahkan produk terlebih dahulu.',
  'insufficient stock':
    'Stok produk tidak mencukupi. Kurangi jumlah atau pilih produk lain.',
  'invalid discount code':
    'Kode diskon tidak valid atau sudah kedaluwarsa.',
  'discount is not usable':
    'Kode diskon sudah kedaluwarsa atau kuota habis.',
  'discount not found':
    'Kode diskon tidak ditemukan.',
  'discount usage exhausted':
    'Kuota voucher sudah habis.',
}

export function translateApiError(message: string): string {
  const lower = message.toLowerCase()
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return value
  }
  return message
}
