'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Vérifier l'authentification
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (!res.ok || data.role !== 'admin') {
          router.push('/')
          return
        }
        
        setAuthenticated(true)
        setLoading(false)
      } catch {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord', href: '/admin' },
    { id: 'stores', icon: '🏪', label: 'Magasins', href: '/admin/stores' },
    { id: 'employees', icon: '👥', label: 'Employés', href: '/admin/employees' },
    { id: 'leaves', icon: '📝', label: 'Demandes de congé', href: '/admin/leaves' },
    { id: 'attendance', icon: '📅', label: 'Présences', href: '/admin/attendance' },
    { id: 'reports', icon: '📈', label: 'Rapports', href: '/admin/reports' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-light">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-bg-main">
      <Sidebar
        userName="Administrateur"
        userRole="Admin"
        userAvatar="AD"
        navItems={navItems}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
