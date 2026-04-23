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
  BarChart3, ChevronLeft, ChevronRight, ChevronDown, Bell,
  Handshake, Package, GitBranch, GitMerge, CheckSquare, X,
  Eye, PackageOpen, MessageSquare, HeartPulse, ClipboardList,
  RefreshCw, Layers, FormInput, Crown,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
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
  live?: boolean
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
  const userName = session?.user
    ? `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim()
    : ''

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
        'lux-chrome fixed inset-y-0 start-0 z-50 flex flex-col border-e transition-all duration-300',
        // Desktop: show based on collapsed state
        'max-lg:hidden',
        collapsed ? 'w-[68px]' : 'w-[260px]',
        // Mobile: overlay drawer
        mobileOpen && 'max-lg:flex max-lg:w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/60 dark:border-white/5">
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

      {/* Workspace chip */}
      {(!collapsed || mobileOpen) && (
        <div className="px-3 pt-4">
          <button
            className="group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-2xl transition-all"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.60) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 4px 12px rgba(15,23,42,0.03)',
            }}
            aria-label="Workspace"
          >
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-900 shadow-sm shrink-0">
              <img src="/images/zainhub-logo-icon.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-start min-w-0">
              <div className="text-[12px] font-semibold text-foreground flex items-center gap-1 truncate">
                {session?.user?.tenantName ?? 'ZainHub AI'}
                <Crown className="w-3 h-3" style={{ color: '#C9A961' }} strokeWidth={1.5} />
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {(session?.user as { roleName?: string })?.roleName ?? 'Super Admin'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-thin">
        <nav aria-label="Main navigation" className="space-y-1 px-2">
          {filteredNavigation.map((group) => (
            <div key={group.titleKey} className="mb-4">
              {(!collapsed || mobileOpen) && (
                <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
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
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-[rgba(59,130,246,0.12)] to-[rgba(30,58,138,0.06)] text-[var(--tenant-primary)] dark:from-[rgba(59,130,246,0.18)] dark:to-[rgba(30,58,138,0.10)] dark:text-[var(--tenant-secondary)] shadow-[0_1px_2px_rgba(30,58,138,0.06),0_4px_12px_rgba(30,58,138,0.06)]'
                          : 'text-muted-foreground hover:bg-white/60 dark:hover:bg-white/5 hover:text-foreground'
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-full lux-bar-gradient"
                        />
                      )}
                      <Icon
                        strokeWidth={isActive ? 2 : 1.6}
                        className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive ? 'text-[var(--tenant-primary)]' : 'group-hover:text-foreground')}
                      />
                      {showExpanded && (
                        <>
                          <span className="flex-1 truncate">{t(item.titleKey)}</span>
                          {item.live && (
                            <span aria-hidden className="lux-live-dot" />
                          )}
                          {badgeCount > 0 && (
                            <Badge variant="secondary" className="h-5 min-w-5 text-[10px] font-semibold bg-white/80 dark:bg-white/10 border border-white/90 dark:border-white/10">
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

      {/* Footer — user identity + collapse toggle */}
      <div className="border-t border-white/60 dark:border-white/5 p-2">
        {(!collapsed || mobileOpen) ? (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 transition">
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EC4899 100%)' }}
              >
                {userName ? getInitials(userName) : 'ZH'}
              </div>
              <span
                aria-hidden
                className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-foreground truncate">
                {userName || 'Zain Hub'}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {session?.user?.email ?? ''}
              </div>
            </div>
            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              aria-expanded="true"
              className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-white/80 dark:hover:bg-white/10 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            aria-expanded="false"
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-white/80 dark:hover:bg-white/10 transition"
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </aside>
  )
}
