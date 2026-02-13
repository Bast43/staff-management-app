import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gestion Personnel',
  description: 'Application de gestion du personnel multi-magasins',
  manifest: '/manifest.json',
  themeColor: '#2D5BFF',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
