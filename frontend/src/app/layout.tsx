import type { Metadata } from 'next'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import AuthSync from '@/components/auth/AuthSync'

export const metadata: Metadata = {
  title: {
    default: 'Seapedia',
    template: '%s | Seapedia',
  },
  description: 'Marketplace produk laut Indonesia — segar, terpercaya, dan terjangkau.',
  keywords: ['seafood', 'marketplace', 'produk laut', 'indonesia'],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <QueryProvider>
          <AuthSync />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
