'use client'

import { Minus, Plus } from 'lucide-react'
import clsx from 'clsx'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  formatDisplay?: (value: number) => string
  className?: string
  size?: 'sm' | 'md'
  variant?: 'default' | 'currency'
}

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
  label,
  formatDisplay,
  className,
  size = 'md',
  variant = 'default',
}: QuantityStepperProps) {
  const decrease = () => onChange(Math.max(min, value - step))
  const increase = () => onChange(Math.min(max, value + step))
  const atMin = value <= min
  const atMax = value >= max

  const btnSize = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  const displaySize = size === 'sm' ? 'h-9 w-10' : 'h-11 w-12'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  const isCurrency = variant === 'currency'

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}
      <div className={clsx(
        'flex items-center',
        isCurrency ? 'w-full gap-2' : 'inline-flex gap-1.5'
      )}>
        <button
          type="button"
          onClick={decrease}
          disabled={atMin}
          aria-label="Kurangi"
          className={clsx(
            'flex flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all',
            btnSize,
            atMin
              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
              : 'border-slate-200 bg-white text-slate-700 hover:border-ocean-300 hover:bg-ocean-50 active:scale-95'
          )}
        >
          <Minus className={iconSize} />
        </button>

        <div className={clsx(
          'flex items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50',
          isCurrency ? 'min-h-11 min-w-0 flex-1 px-3' : clsx('flex-shrink-0 px-2', displaySize)
        )}>
          <span className={clsx(
            'font-semibold text-slate-900 tabular-nums',
            isCurrency ? 'text-sm sm:text-base' : textSize
          )}>
            {formatDisplay ? formatDisplay(value) : value}
          </span>
        </div>

        <button
          type="button"
          onClick={increase}
          disabled={atMax}
          aria-label="Tambah"
          className={clsx(
            'flex flex-shrink-0 items-center justify-center rounded-xl border-2 transition-all',
            btnSize,
            atMax
              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
              : 'border-slate-200 bg-white text-slate-700 hover:border-ocean-300 hover:bg-ocean-50 active:scale-95'
          )}
        >
          <Plus className={iconSize} />
        </button>
      </div>
    </div>
  )
}
