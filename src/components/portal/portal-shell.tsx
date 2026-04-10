'use client'

import { useState } from 'react'
import { PortalNavbar } from './portal-navbar'
import { PortalSidebar } from './portal-sidebar'
import { PortalAuthGuard } from './portal-auth-guard'

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <PortalAuthGuard>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <PortalSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <PortalNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </PortalAuthGuard>
  )
}
