import { Fish, Waves } from 'lucide-react'
import clsx from 'clsx'

const GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-teal-500 to-emerald-600',
  'from-sky-500 to-indigo-600',
  'from-blue-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-purple-600',
]

function hashIndex(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h + str.charCodeAt(i)) % GRADIENTS.length
  return h
}

interface ProductImageProps {
  name?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { box: 'h-28', icon: 'h-8 w-8' },
  md: { box: 'h-36', icon: 'h-10 w-10' },
  lg: { box: 'h-48', icon: 'h-14 w-14' },
}

export default function ProductImage({ name = 'product', className, size = 'md' }: ProductImageProps) {
  const gradient = GRADIENTS[hashIndex(name)]
  const s = sizeMap[size]

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br',
        gradient,
        s.box,
        className
      )}
    >
      <div className="absolute inset-0 opacity-20">
        <Waves className="absolute -bottom-2 -right-2 h-24 w-24 text-white" />
        <Waves className="absolute -left-4 top-4 h-16 w-16 text-white/50" />
      </div>
      <Fish className={clsx(s.icon, 'relative text-white/90 drop-shadow')} />
    </div>
  )
}
