'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerApi } from '@/lib/api/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Role } from '@/types'

const AVAILABLE_ROLES: { value: Exclude<Role, 'ADMIN' | 'PENDING'>; label: string; description: string }[] = [
  { value: 'BUYER', label: 'Pembeli', description: 'Beli produk laut segar' },
  { value: 'SELLER', label: 'Penjual', description: 'Jual produk di platform' },
  { value: 'DRIVER', label: 'Driver', description: 'Antar pesanan ke pelanggan' },
]

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username maksimal 50 karakter'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password terlalu panjang'),
  confirmPassword: z.string(),
  roles: z
    .array(z.enum(['BUYER', 'SELLER', 'DRIVER']))
    .min(1, 'Pilih minimal satu peran'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { roles: [] },
  })

  const selectedRoles = watch('roles') ?? []

  const toggleRole = (role: 'BUYER' | 'SELLER' | 'DRIVER') => {
    if (selectedRoles.includes(role)) {
      setValue('roles', selectedRoles.filter((r) => r !== role), { shouldValidate: true })
    } else {
      setValue('roles', [...selectedRoles, role], { shouldValidate: true })
    }
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null)
    setSuccessMsg(null)

    const { confirmPassword: _, ...payload } = values

    try {
      await registerApi({
        ...payload,
        phone: payload.phone || undefined,
        roles: payload.roles as Role[],
      })

      setSuccessMsg('Akun berhasil dibuat! Silakan masuk.')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registrasi gagal. Silakan coba lagi.'
      setServerError(errorMsg)
    }
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean-50">
            <span className="text-2xl">🌊</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Buat Akun Baru</h1>
          <p className="mt-1 text-sm text-slate-500">Bergabunglah dengan Seapedia</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Username"
            placeholder="contoh: johndoe"
            error={errors.username?.message}
            required
            {...register('username')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="email@contoh.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Input
            label="No. Telepon (Opsional)"
            type="tel"
            placeholder="08xxxxxxxxxx"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <Input
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />

          {/* Role selection */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">
              Pilih Peran <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-slate-500">Anda bisa memilih lebih dari satu peran.</p>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_ROLES.map(({ value, label, description }) => {
                const isSelected = selectedRoles.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleRole(value)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-ocean-500 bg-ocean-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-xs font-semibold ${isSelected ? 'text-ocean-700' : 'text-slate-700'}`}>
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{description}</p>
                  </button>
                )
              })}
            </div>
            {errors.roles && (
              <p className="text-xs text-red-500">{errors.roles.message}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="mt-2 w-full"
          >
            Daftar Sekarang
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-ocean-600 hover:text-ocean-700">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
