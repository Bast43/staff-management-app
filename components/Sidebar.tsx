'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'

type NavItem = {
  id: string
  icon: string
  label: string
  href: string
}

type SidebarProps = {
  userName: string
  userRole: string
  userAvatar: string
  navItems: NavItem[]
  onLogout: () => void
}

export default function Sidebar({ userName, userRole, userAvatar, navItems, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="w-72 bg-card-bg border-r border-border p-6 flex flex-col h-screen sticky top-0">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white text-xl font-bold">
            GP
          </div>
          <span className="text-xl font-bold text-primary">Gestion Personnel</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(item.href)}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </div>
        ))}

        <div
          onClick={onLogout}
          className="nav-item text-danger hover:bg-danger/10 cursor-pointer mt-8"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Déconnexion</span>
        </div>
      </nav>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-main transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {userAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{userName}</div>
            <div className="text-xs text-text-light truncate">{userRole}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
