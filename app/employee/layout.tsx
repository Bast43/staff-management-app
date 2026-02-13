'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (!res.ok || data.role !== 'employee') {
          router.push('/')
          return
        }
        
        // Récupérer les infos complètes de l'utilisateur
        const userRes = await fetch('/api/employees/me')
        if (userRes.ok) {
          setUser(await userRes.json())
        }
        
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
    { id: 'dashboard', icon: '📊', label: 'Mon tableau de bord', href: '/employee' },
    { id: 'leave', icon: '🏖️', label: 'Mes congés', href: '/employee/leave' },
  ]

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

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'EM'

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={user?.name || 'Employé'}
        userRole={user?.position || 'Employé'}
        userAvatar={initials}
        navItems={navItems}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 bg-bg-main overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
