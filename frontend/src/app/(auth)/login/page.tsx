import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md animate-pulse rounded-2xl bg-gray-100 p-8 h-96" />}>
      <LoginForm />
    </Suspense>
  )
}
