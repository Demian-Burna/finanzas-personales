import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/shared/providers'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  themeColor: '#6366f1',
}

export const metadata: Metadata = {
  title: {
    default: 'Finanzas Personales',
    template: '%s | Finanzas Personales',
  },
  description: 'Gestiona tus finanzas personales de forma inteligente',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-icono.svg',
    apple: '/logo-icono.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Finanzas',
  },
  openGraph: {
    title: 'Finanzas Personales',
    description: 'Gestiona tus finanzas personales de forma inteligente',
    type: 'website',
    images: [{ url: '/og', width: 600, height: 180 }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
