'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Building2, UserCircle, Target,
  Briefcase, ListTodo, FileText, Receipt, CreditCard,
  Wallet, Share2, Calendar as CalendarIcon,
  Megaphone, HeadphonesIcon, Settings, Shield, Activity,
  BarChart3, ChevronLeft, ChevronRight, Bell,
  Handshake, Package, GitBranch, X
} from 'lucide-react'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ElementType
  badge?: number
  permission?: string
}

interface NavGroup {
  titleKey: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    titleKey: 'nav.main',
    items: [
      { titleKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
      { titleKey: 'nav.notifications', href: '/notifications', icon: Bell, badge: 5 },
    ],
  },
  {
    titleKey: 'nav.crmSales',
    items: [
      { titleKey: 'nav.leads', href: '/leads', icon: Target },
      { titleKey: 'nav.opportunities', href: '/opportunities', icon: Handshake },
      { titleKey: 'nav.companies', href: '/companies', icon: Building2 },
      { titleKey: 'nav.contacts', href: '/contacts', icon: UserCircle },
      { titleKey: 'nav.services', href: '/services', icon: Package },
      { titleKey: 'nav.pipelines', href: '/pipelines', icon: GitBranch },
    ],
  },
  {
    titleKey: 'nav.delivery',
    items: [
      { titleKey: 'nav.projects', href: '/projects', icon: Briefcase },
      { titleKey: 'nav.tasks', href: '/tasks', icon: ListTodo },
    ],
  },
  {
    titleKey: 'nav.finance',
    items: [
      { titleKey: 'nav.quotations', href: '/quotations', icon: FileText },
      { titleKey: 'nav.proposals', href: '/proposals', icon: FileText },
      { titleKey: 'nav.contracts', href: '/contracts', icon: FileText },
      { titleKey: 'nav.invoices', href: '/invoices', icon: Receipt },
      { titleKey: 'nav.payments', href: '/payments', icon: CreditCard },
      { titleKey: 'nav.expenses', href: '/expenses', icon: Wallet },
    ],
  },
  {
    titleKey: 'nav.marketing',
    items: [
      { titleKey: 'nav.contentCalendar', href: '/content-calendar', icon: CalendarIcon },
      { titleKey: 'nav.socialAccounts', href: '/social-accounts', icon: Share2 },
      { titleKey: 'nav.campaigns', href: '/campaigns', icon: Megaphone },
    ],
  },
  {
    titleKey: 'nav.support',
    items: [
      { titleKey: 'nav.tickets', href: '/tickets', icon: HeadphonesIcon },
    ],
  },
  {
    titleKey: 'nav.admin',
    items: [
      { titleKey: 'nav.users', href: '/admin/users', icon: Users },
      { titleKey: 'nav.roles', href: '/admin/roles', icon: Shield },
      { titleKey: 'nav.settings', href: '/admin/settings', icon: Settings },
      { titleKey: 'nav.auditLog', href: '/admin/audit-log', icon: Activity },
      { titleKey: 'nav.reports', href: '/reports', icon: BarChart3 },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        'fixed inset-y-0 start-0 z-50 flex flex-col border-e bg-card transition-all duration-300',
        // Desktop: show based on collapsed state
        'max-lg:hidden',
        collapsed ? 'w-[68px]' : 'w-[260px]',
        // Mobile: overlay drawer
        mobileOpen && 'max-lg:flex max-lg:w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {(!collapsed || mobileOpen) ? (
          <Link href="/dashboard">
            <ZainHubLogo variant="full" />
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <ZainHubLogo variant="icon" />
          </Link>
        )}
        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav aria-label="Main navigation" className="space-y-1 px-2">
          {navigation.map((group) => (
            <div key={group.titleKey} className="mb-4">
              {(!collapsed || mobileOpen) && (
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t(group.titleKey)}
                </p>
              )}
              {collapsed && !mobileOpen && <div className="h-px bg-border my-2" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  const showExpanded = !collapsed || mobileOpen

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-blue-600' : '')} />
                      {showExpanded && (
                        <>
                          <span className="flex-1 truncate">{t(item.titleKey)}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="h-5 min-w-5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  )

                  if (collapsed && !mobileOpen) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger render={<span />}>{linkContent}</TooltipTrigger>
                        <TooltipContent side="inline-end" className="font-medium">
                          {t(item.titleKey)}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return linkContent
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle - desktop only */}
      <div className="border-t p-2 max-lg:hidden">
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  )
}
