'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  GitPullRequest,
  Eye,
  FileText,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/services', label: 'My Services', icon: Package },
  { href: '/portal/change-requests', label: 'Change Requests', icon: GitPullRequest },
  { href: '/portal/preview-links', label: 'Preview Links', icon: Eye },
  { href: '/portal/documents', label: 'Documents', icon: FileText },
]

interface PortalSidebarProps {
  open?: boolean
  onClose?: () => void
}

export function PortalSidebar({ open, onClose }: PortalSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 flex flex-col',
          'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Close button (mobile) */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Menu</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logo area (desktop) */}
        <div className="hidden lg:flex items-center px-4 h-16 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-blue-600 text-lg">Client Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400 text-center">Powered by Zain Hub BOS</p>
        </div>
      </aside>
    </>
  )
}
