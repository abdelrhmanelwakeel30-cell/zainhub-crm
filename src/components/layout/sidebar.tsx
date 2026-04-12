'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Building2, UserCircle, Target,
  Briefcase, ListTodo, FileText, Receipt, CreditCard,
  Wallet, Share2, Calendar as CalendarIcon,
  Megaphone, HeadphonesIcon, Settings, Shield, Activity,
  BarChart3, ChevronLeft, ChevronRight, Bell,
  Handshake, Package, GitBranch, GitMerge, CheckSquare, X,
  Eye, PackageOpen, MessageSquare, HeartPulse, ClipboardList,
  RefreshCw, Layers, FormInput
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { hasPermission } from '@/lib/permissions'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ElementType
  badge?: number
  permission?: string
  dynamicBadge?: 'unreadNotifications'
}

interface NavGroup {
  titleKey: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    titleKey: 'nav.main',
    items: [
      { titleKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
      { titleKey: 'nav.notifications', href: '/notifications', icon: Bell, dynamicBadge: 'unreadNotifications' },
    ],
  },
  {
    titleKey: 'nav.crmSales',
    items: [
      { titleKey: 'nav.leads', href: '/leads', icon: Target, permission: 'leads:view' },
      { titleKey: 'nav.opportunities', href: '/opportunities', icon: Handshake, permission: 'opportunities:view' },
      { titleKey: 'nav.companies', href: '/companies', icon: Building2, permission: 'companies:view' },
      { titleKey: 'nav.contacts', href: '/contacts', icon: UserCircle, permission: 'contacts:view' },
      { titleKey: 'nav.services', href: '/services', icon: Package, permission: 'settings:view' },
      { titleKey: 'nav.pipelines', href: '/pipelines', icon: GitBranch, permission: 'settings:view' },
    ],
  },
  {
    titleKey: 'nav.delivery',
    items: [
      { titleKey: 'nav.projects', href: '/projects', icon: Briefcase, permission: 'projects:view' },
      { titleKey: 'nav.tasks', href: '/tasks', icon: ListTodo, permission: 'tasks:view' },
      { titleKey: 'nav.clientServices', href: '/client-services', icon: Activity, permission: 'projects:view' },
      { titleKey: 'nav.deliverables', href: '/deliverables', icon: PackageOpen, permission: 'deliverables:view' },
      { titleKey: 'nav.previewLinks', href: '/preview-links', icon: Eye, permission: 'preview_links:view' },
      { titleKey: 'nav.communicationLog', href: '/communication-log', icon: MessageSquare, permission: 'comms:view' },
      { titleKey: 'nav.accountHealth', href: '/account-health', icon: HeartPulse, permission: 'projects:view' },
      { titleKey: 'nav.onboarding', href: '/onboarding', icon: ClipboardList, permission: 'projects:view' },
    ],
  },
  {
    titleKey: 'nav.finance',
    items: [
      { titleKey: 'nav.quotations', href: '/quotations', icon: FileText, permission: 'quotations:view' },
      { titleKey: 'nav.proposals', href: '/proposals', icon: FileText, permission: 'proposals:view' },
      { titleKey: 'nav.contracts', href: '/contracts', icon: FileText, permission: 'contracts:view' },
      { titleKey: 'nav.invoices', href: '/invoices', icon: Receipt, permission: 'invoices:view' },
      { titleKey: 'nav.payments', href: '/payments', icon: CreditCard, permission: 'payments:view' },
      { titleKey: 'nav.expenses', href: '/expenses', icon: Wallet, permission: 'expenses:view' },
      { titleKey: 'nav.subscriptions', href: '/subscriptions', icon: RefreshCw, permission: 'invoices:view' },
    ],
  },
  {
    titleKey: 'nav.marketing',
    items: [
      { titleKey: 'nav.contentCalendar', href: '/content-calendar', icon: CalendarIcon, permission: 'social_media:view' },
      { titleKey: 'nav.socialAccounts', href: '/social-accounts', icon: Share2, permission: 'social_media:view' },
      { titleKey: 'nav.campaigns', href: '/campaigns', icon: Megaphone, permission: 'campaigns:view' },
    ],
  },
  {
    titleKey: 'nav.support',
    items: [
      { titleKey: 'nav.tickets', href: '/tickets', icon: HeadphonesIcon, permission: 'tickets:view' },
      { titleKey: 'nav.changeRequests', href: '/change-requests', icon: GitMerge, permission: 'change_requests:view' },
      { titleKey: 'nav.approvals', href: '/approvals', icon: CheckSquare, permission: 'approvals:view' },
    ],
  },
  {
    titleKey: 'nav.growth',
    items: [
      { titleKey: 'nav.bundles', href: '/bundles', icon: Layers, permission: 'settings:view' },
      { titleKey: 'nav.forms', href: '/forms', icon: FormInput, permission: 'leads:view' },
    ],
  },
  {
    titleKey: 'nav.admin',
    items: [
      { titleKey: 'nav.users', href: '/admin/users', icon: Users, permission: 'users:view' },
      { titleKey: 'nav.roles', href: '/admin/roles', icon: Shield, permission: 'roles:view' },
      { titleKey: 'nav.settings', href: '/admin/settings', icon: Settings, permission: 'settings:view' },
      { titleKey: 'nav.auditLog', href: '/admin/audit-log', icon: Activity, permission: 'audit_log:view' },
      { titleKey: 'nav.reports', href: '/reports', icon: BarChart3, permission: 'reports:view' },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NotificationsResponse {
  total: number
  [key: string]: any
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations()
  const { data: session } = useSession()
  const userPermissions: string[] = (session?.user as { permissions?: string[] })?.permissions ?? []

  // Filter nav items by permission — if no permission specified, always show
  const filteredNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || hasPermission(userPermissions, item.permission)
    ),
  })).filter((group) => group.items.length > 0)

  const { data: notificationsData } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?unreadOnly=true&pageSize=1')
      if (!res.ok) throw new Error('Failed to fetch notifications count')
      return res.json()
    },
    staleTime: 30_000,
  })

  const unreadCount = notificationsData?.total ?? 0

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
      <div className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-thin">
        <nav aria-label="Main navigation" className="space-y-1 px-2">
          {filteredNavigation.map((group) => (
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

                  const badgeCount = item.dynamicBadge === 'unreadNotifications'
                    ? unreadCount
                    : (item.badge ?? 0)

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[hsl(var(--tenant-primary-hsl)/0.1)] text-[var(--tenant-primary)] dark:bg-[hsl(var(--tenant-primary-hsl)/0.15)] dark:text-[var(--tenant-secondary)]'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-[var(--tenant-primary)]' : '')} />
                      {showExpanded && (
                        <>
                          <span className="flex-1 truncate">{t(item.titleKey)}</span>
                          {badgeCount > 0 && (
                            <Badge variant="secondary" className="h-5 min-w-5 text-xs">
                              {badgeCount}
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
      </div>

      {/* Collapse toggle - desktop only */}
      <div className="border-t p-2 max-lg:hidden">
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          {collapsed ? <ChevronRight className="h-4 w-4 rtl:rotate-180" /> : <ChevronLeft className="h-4 w-4 rtl:rotate-180" />}
        </button>
      </div>
    </aside>
  )
}
