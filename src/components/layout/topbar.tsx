'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import {
  Search, Globe, Moon, Sun, LogOut, User, Settings, ChevronDown, Menu, Plus, ChevronRight,
  UserPlus, Building2, Target, Ticket, FileText,
} from 'lucide-react'
import { NotificationDropdown } from '@/components/layout/notification-dropdown'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'

interface TopbarProps {
  onSearchOpen?: () => void
  onMobileMenuToggle?: () => void
}

// Map known pathnames → human label for the breadcrumb.
// Falls back to prettifying the last segment.
function labelForPath(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean).pop() ?? 'Dashboard'
  return seg
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Topbar({ onSearchOpen, onMobileMenuToggle }: TopbarProps) {
  const { data: session } = useSession()
  const t = useTranslations()
  const { theme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const [currentLocale, setCurrentLocale] = useState(() =>
    typeof document !== 'undefined'
      ? (document.cookie.match(/locale=(\w+)/)?.[1] ?? 'en')
      : 'en',
  )

  const toggleLocale = () => {
    startTransition(() => {
      const next = currentLocale === 'en' ? 'ar' : 'en'
      document.cookie = `locale=${next};path=/;max-age=31536000`
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.lang = next
      setCurrentLocale(next)
      window.location.reload()
    })
  }

  const router = useRouter()
  const userName = session?.user ? `${session.user.firstName} ${session.user.lastName}` : ''
  const pageLabel = labelForPath(pathname)

  return (
    <header className="lux-chrome sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 md:px-6">
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

      {/* Breadcrumb — hidden on small screens */}
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-2 text-[13px] shrink-0">
        <span className="text-muted-foreground">Workspace</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70 rtl:rotate-180" strokeWidth={1.5} />
        <span className="text-foreground font-semibold">{pageLabel}</span>
      </nav>

      {/* Centered command palette search */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={onSearchOpen}
          className="w-full max-w-xl flex items-center gap-3 h-10 px-4 rounded-xl text-[13px] transition hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(15,23,42,0.05)] bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.03),inset_0_1px_0_rgba(255,255,255,0.6)]"
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="flex-1 text-start text-muted-foreground">{t('common.search')}</span>
          <kbd className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/10">⌘K</kbd>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Quick new — dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-10 px-3 rounded-xl text-[13px] font-medium text-foreground hover:bg-white/70 dark:hover:bg-white/10 hidden sm:flex items-center gap-1.5 transition"
              aria-label="Create new"
            >
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden xl:inline">New</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Quick create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/leads?new=1')}>
              <UserPlus className="h-4 w-4 me-2 text-blue-500" /> New Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/contacts?new=1')}>
              <User className="h-4 w-4 me-2 text-green-500" /> New Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/companies?new=1')}>
              <Building2 className="h-4 w-4 me-2 text-orange-500" /> New Company
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/opportunities?new=1')}>
              <Target className="h-4 w-4 me-2 text-purple-500" /> New Opportunity
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/tickets?new=1')}>
              <Ticket className="h-4 w-4 me-2 text-red-500" /> New Ticket
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/proposals?new=1')}>
              <FileText className="h-4 w-4 me-2 text-yellow-500" /> New Proposal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span aria-hidden className="hidden md:block h-6 w-px bg-slate-200/70 dark:bg-white/10 mx-1" />

        {/* Language — shows EN/AR label */}
        <button
          onClick={toggleLocale}
          disabled={isPending}
          aria-label="Toggle language"
          className="h-10 px-2.5 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 flex items-center gap-1.5 text-[12px] font-semibold text-foreground tracking-wider transition"
        >
          <Globe className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">{currentLocale.toUpperCase()}</span>
        </button>

        {/* Theme — gold icon */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative h-10 w-10 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 flex items-center justify-center transition"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" strokeWidth={1.5} style={{ color: '#C9A961' }} />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" strokeWidth={1.5} style={{ color: '#C9A961' }} fill="currentColor" />
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-10 ps-1 pe-2 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className="text-[11px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EC4899 100%)' }}
                >
                  {userName ? getInitials(userName) : 'ZH'}
                </AvatarFallback>
              </Avatar>
              <span aria-hidden className="absolute -bottom-0.5 -end-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div className="hidden lg:block text-start leading-tight">
              <p className="text-[12px] font-semibold text-foreground">{session?.user?.firstName ?? userName}</p>
              <p className="text-[10px] text-muted-foreground">{(session?.user as { roleName?: string })?.roleName ?? 'Super Admin'}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden lg:block" strokeWidth={1.5} />
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
