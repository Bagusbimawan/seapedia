import { type HTMLAttributes } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean
}

export default function Card({ noPadding = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200/80 bg-white shadow-card',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={clsx('mb-4 border-b border-gray-100 pb-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={clsx('text-base font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
}
