'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/useAuthStore'
import { login as loginApi } from '@/lib/api/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import DemoAccountsPanel from '@/components/auth/DemoAccountsPanel'
import type { Role } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function getRoleRedirect(role: Role): string {
  return `/${role.toLowerCase()}`
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    try {
      const res = await loginApi(values)
      const { data } = res.data

      if (!data) {
        setServerError('Respons tidak valid dari server.')
        return
      }

      if (data.needs_role_select) {
        setAuth(data.token, data.user, 'PENDING')
        Cookies.set('seapedia-token', data.token, { expires: 7, sameSite: 'lax' })
        Cookies.set('seapedia-role', 'PENDING', { expires: 7, sameSite: 'lax' })
        router.push('/role-select')
      } else {
        setAuth(data.token, data.user, data.active_role)
        Cookies.set('seapedia-token', data.token, { expires: 7, sameSite: 'lax' })
        Cookies.set('seapedia-role', data.active_role, { expires: 7, sameSite: 'lax' })

        const redirect = searchParams.get('redirect') ?? getRoleRedirect(data.active_role)
        router.push(redirect)
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Login gagal. Periksa kembali email dan password Anda.'
      setServerError(errorMsg)
    }
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-soft">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ocean-50">
            <span className="text-2xl">👋</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Selamat Datang</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk ke akun Seapedia Anda</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="email@contoh.com"
            error={errors.email?.message}
            required
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            error={errors.password?.message}
            required
            {...register('password')}
          />

          {serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="mt-2 w-full"
          >
            Masuk
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-ocean-600 hover:text-ocean-700">
            Daftar sekarang
          </Link>
        </p>
      </div>

      <DemoAccountsPanel
        onSelect={(email, password) => {
          setValue('email', email, { shouldValidate: true })
          setValue('password', password, { shouldValidate: true })
        }}
      />
    </div>
  )
}
