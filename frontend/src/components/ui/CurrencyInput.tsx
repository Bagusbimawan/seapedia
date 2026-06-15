'use client'

import Input from '@/components/ui/Input'

interface CurrencyInputProps {
  label?: string
  value: number
  onChange: (value: number) => void
  required?: boolean
  error?: string
  placeholder?: string
}

function formatIdrDisplay(value: number): string {
  if (!value) return ''
  return new Intl.NumberFormat('id-ID').format(value)
}

function parseIdrInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function CurrencyInput({
  label,
  value,
  onChange,
  required,
  error,
  placeholder = '0',
}: CurrencyInputProps) {
  return (
    <Input
      label={label}
      inputMode="numeric"
      value={formatIdrDisplay(value)}
      placeholder={placeholder}
      required={required}
      error={error}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw ? parseIdrInput(raw) : 0)
      }}
    />
  )
}
