'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type SidebarProps = {
  userName: string
  userRole: string
  userAvatar: string
  navItems: Array<{
    id: string
    icon: string
    label: string
    href: string
  }>
  onLogout: () => void
}

export default function Sidebar({ userName, userRole, userAvatar, navItems, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* ✅ BOUTON HAMBURGER MOBILE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-95"
        aria-label="Menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* ✅ OVERLAY MOBILE (ferme au clic) */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ✅ SIDEBAR RESPONSIVE */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-card-bg border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Profil */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              {userAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{userName}</div>
              <div className="text-sm text-text-light truncate">{userRole}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsOpen(false)} // ✅ Ferme le menu après clic
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'hover:bg-bg-main text-text-main'
                  }
                `}
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-danger/10 text-danger transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
