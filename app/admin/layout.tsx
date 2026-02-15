'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/employees/me')
      if (res.ok) {
        const data = await res.json()
        if (data.role !== 'admin') {
          router.push('/employee')
          return
        }
        setUser(data)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-light">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Tableau de bord', href: '/admin' },
    { id: 'stores', icon: '🏪', label: 'Magasins', href: '/admin/stores' },
    { id: 'employees', icon: '👥', label: 'Employés', href: '/admin/employees' },
    { id: 'leaves', icon: '🏖️', label: 'Demandes de congé', href: '/admin/leaves' },
    { id: 'attendance', icon: '✓', label: 'Présences', href: '/admin/attendance' },
    { id: 'reports', icon: '📈', label: 'Rapports', href: '/admin/reports' },
  ]

  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={user.name}
        userRole="Administrateur"
        userAvatar={initials}
        navItems={navItems}
        onLogout={handleLogout}
      />
      {/* ✅ MAIN CONTENT RESPONSIVE */}
      <main className="flex-1 w-full lg:w-auto overflow-x-hidden">
        {/* ✅ PADDING ADAPTATIF : Plus d'espace en haut sur mobile pour le bouton hamburger */}
        <div className="p-4 pt-20 sm:p-6 sm:pt-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
