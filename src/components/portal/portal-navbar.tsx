'use client'

import { Menu, LogOut, User } from 'lucide-react'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import { usePortalAuth } from './portal-auth-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PortalNavbarProps {
  onMenuClick: () => void
}

export function PortalNavbar({ onMenuClick }: PortalNavbarProps) {
  const { user, logout } = usePortalAuth()

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-10 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
      {/* Mobile menu button */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <ZainHubLogo variant="full" className="hidden lg:flex" />

      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 rounded-md hover:bg-accent transition-colors outline-none">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium">
            {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">{user ? `${user.firstName} ${user.lastName}` : ''}</span>
              <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <User className="h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="gap-2 text-red-600 focus:text-red-600">
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
