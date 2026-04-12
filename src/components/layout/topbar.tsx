'use client'

import { useState, useTransition } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Search, Globe, Moon, Sun, LogOut, User, Settings, ChevronDown, Menu } from 'lucide-react'
import { NotificationDropdown } from '@/components/layout/notification-dropdown'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'

interface TopbarProps {
  onSearchOpen?: () => void
  onMobileMenuToggle?: () => void
}

export function Topbar({ onSearchOpen, onMobileMenuToggle }: TopbarProps) {
  const { data: session } = useSession()
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = () => {
    startTransition(() => {
      const current = document.cookie.match(/locale=(\w+)/)?.[1] || 'en'
      const next = current === 'en' ? 'ar' : 'en'
      document.cookie = `locale=${next};path=/;max-age=31536000`
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = next
      window.location.reload()
    })
  }

  const userName = session?.user ? `${session.user.firstName} ${session.user.lastName}` : ''

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-72"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.search')}</span>
          <kbd className="ms-auto text-xs bg-background border rounded px-1.5 py-0.5 hidden sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Language toggle */}
        <Button variant="ghost" size="icon" onClick={toggleLocale} disabled={isPending} aria-label="Toggle language">
          <Globe className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {userName ? getInitials(userName) : 'ZH'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-start">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.email}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.tenantName}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4 me-2" /> {t('settings.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 me-2" /> {t('settings.title')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-red-600">
              <LogOut className="h-4 w-4 me-2" /> {t('auth.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
