'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Search, Users, Building2, UserCircle, Briefcase,
  LayoutDashboard, FileText, ArrowRight,
  FolderOpen, Receipt, HeadphonesIcon, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResult {
  id: string
  type: 'lead' | 'company' | 'contact' | 'opportunity' | 'project' | 'invoice' | 'ticket' | 'page'
  title: string
  subtitle: string
  href: string
}

const pages: SearchResult[] = [
  { id: 'p-dash', type: 'page', title: 'Dashboard', subtitle: 'Executive overview', href: '/dashboard' },
  { id: 'p-leads', type: 'page', title: 'Leads', subtitle: 'Lead management', href: '/leads' },
  { id: 'p-companies', type: 'page', title: 'Companies', subtitle: 'Company accounts', href: '/companies' },
  { id: 'p-contacts', type: 'page', title: 'Contacts', subtitle: 'Contact directory', href: '/contacts' },
  { id: 'p-opps', type: 'page', title: 'Opportunities', subtitle: 'Sales pipeline', href: '/opportunities' },
  { id: 'p-projects', type: 'page', title: 'Projects', subtitle: 'Project delivery', href: '/projects' },
  { id: 'p-tasks', type: 'page', title: 'Tasks', subtitle: 'Task management', href: '/tasks' },
  { id: 'p-invoices', type: 'page', title: 'Invoices', subtitle: 'Billing & invoices', href: '/invoices' },
  { id: 'p-expenses', type: 'page', title: 'Expenses', subtitle: 'Expense tracking', href: '/expenses' },
  { id: 'p-quotations', type: 'page', title: 'Quotations', subtitle: 'Price quotes', href: '/quotations' },
  { id: 'p-proposals', type: 'page', title: 'Proposals', subtitle: 'Client proposals', href: '/proposals' },
  { id: 'p-contracts', type: 'page', title: 'Contracts', subtitle: 'Contract management', href: '/contracts' },
  { id: 'p-payments', type: 'page', title: 'Payments', subtitle: 'Payment records', href: '/payments' },
  { id: 'p-tickets', type: 'page', title: 'Tickets', subtitle: 'Support tickets', href: '/tickets' },
  { id: 'p-campaigns', type: 'page', title: 'Campaigns', subtitle: 'Marketing campaigns', href: '/campaigns' },
  { id: 'p-content', type: 'page', title: 'Content Calendar', subtitle: 'Social media content', href: '/content-calendar' },
  { id: 'p-services', type: 'page', title: 'Services', subtitle: 'Service catalog', href: '/services' },
  { id: 'p-pipelines', type: 'page', title: 'Pipelines', subtitle: 'Sales pipelines', href: '/pipelines' },
  { id: 'p-social', type: 'page', title: 'Social Accounts', subtitle: 'Connected social media', href: '/social-accounts' },
  { id: 'p-notifications', type: 'page', title: 'Notifications', subtitle: 'Alerts & notifications', href: '/notifications' },
  { id: 'p-reports', type: 'page', title: 'Reports', subtitle: 'Analytics & reports', href: '/reports' },
  { id: 'p-users', type: 'page', title: 'Users', subtitle: 'User management', href: '/admin/users' },
  { id: 'p-roles', type: 'page', title: 'Roles & Permissions', subtitle: 'Access control', href: '/admin/roles' },
  { id: 'p-settings', type: 'page', title: 'Settings', subtitle: 'System configuration', href: '/admin/settings' },
  { id: 'p-audit', type: 'page', title: 'Audit Log', subtitle: 'System audit trail', href: '/admin/audit-log' },
]

const typeIcons: Record<string, React.ReactNode> = {
  lead: <Users className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
  contact: <UserCircle className="h-4 w-4" />,
  opportunity: <Briefcase className="h-4 w-4" />,
  project: <FolderOpen className="h-4 w-4" />,
  invoice: <Receipt className="h-4 w-4" />,
  ticket: <HeadphonesIcon className="h-4 w-4" />,
  page: <LayoutDashboard className="h-4 w-4" />,
}

const typeLabels: Record<string, string> = {
  lead: 'Leads',
  company: 'Companies',
  contact: 'Contacts',
  opportunity: 'Opportunities',
  project: 'Projects',
  invoice: 'Invoices',
  ticket: 'Tickets',
  page: 'Pages',
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const t = useTranslations('common')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const enabled = open && debouncedQuery.length >= 2

  const { data: leadsData, isFetching: leadsFetching } = useQuery({
    queryKey: ['cmd-search', 'leads', debouncedQuery],
    queryFn: () => fetch(`/api/leads?search=${encodeURIComponent(debouncedQuery)}&pageSize=5`).then(r => r.json()),
    enabled,
    staleTime: 30_000,
  })
  const { data: companiesData, isFetching: companiesFetching } = useQuery({
    queryKey: ['cmd-search', 'companies', debouncedQuery],
    queryFn: () => fetch(`/api/companies?search=${encodeURIComponent(debouncedQuery)}&pageSize=5`).then(r => r.json()),
    enabled,
    staleTime: 30_000,
  })
  const { data: contactsData, isFetching: contactsFetching } = useQuery({
    queryKey: ['cmd-search', 'contacts', debouncedQuery],
    queryFn: () => fetch(`/api/contacts?search=${encodeURIComponent(debouncedQuery)}&pageSize=5`).then(r => r.json()),
    enabled,
    staleTime: 30_000,
  })

  const isFetching = leadsFetching || companiesFetching || contactsFetching

  const results = useMemo((): SearchResult[] => {
    const q = debouncedQuery.toLowerCase()
    if (!q) return pages

    const matched: SearchResult[] = []

    // Leads from API
    const leadsArr: Array<{ id: string; leadNumber: string; fullName: string; companyName?: string; stage?: { name: string } }> = leadsData?.data ?? []
    leadsArr.forEach(l => {
      matched.push({ id: l.id, type: 'lead', title: l.fullName, subtitle: `${l.leadNumber} · ${l.companyName || ''} · ${l.stage?.name ?? ''}`, href: `/leads/${l.id}` })
    })

    // Companies from API
    const companiesArr: Array<{ id: string; companyNumber: string; displayName: string; industry?: string }> = companiesData?.data ?? []
    companiesArr.forEach(c => {
      matched.push({ id: c.id, type: 'company', title: c.displayName, subtitle: `${c.companyNumber} · ${c.industry ?? ''}`, href: `/companies/${c.id}` })
    })

    // Contacts from API
    const contactsArr: Array<{ id: string; contactNumber?: string; firstName: string; lastName: string; email?: string; jobTitle?: string }> = contactsData?.data ?? []
    contactsArr.forEach(c => {
      matched.push({ id: c.id, type: 'contact', title: `${c.firstName} ${c.lastName}`, subtitle: `${c.email ?? ''} · ${c.jobTitle ?? ''}`, href: `/contacts/${c.id}` })
    })

    // Pages (static filter)
    pages.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
        matched.push(p)
      }
    })

    return matched
  }, [debouncedQuery, leadsData, companiesData, contactsData])

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    })
    return groups
  }, [results])

  const flatResults = useMemo(() => results, [results])

  const navigate = useCallback((result: SearchResult) => {
    router.push(result.href)
    onOpenChange(false)
    setQuery('')
    setActiveIndex(0)
  }, [router, onOpenChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flatResults[activeIndex]) {
      e.preventDefault()
      navigate(flatResults[activeIndex])
    }
  }, [flatResults, activeIndex, navigate])

  useEffect(() => {
    if (open) {
      setQuery('')
      setDebouncedQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const active = listRef.current?.querySelector('[data-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  let runningIndex = -1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Search commands and pages</DialogTitle>
        <div className="flex items-center border-b px-4" onKeyDown={handleKeyDown}>
          {isFetching ? (
            <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            placeholder={`${t('search')}...`}
            className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-xs text-muted-foreground bg-muted border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {flatResults.length === 0 && debouncedQuery ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="mb-2">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {typeLabels[type] || type}
                </p>
                {items.map(item => {
                  runningIndex++
                  const idx = runningIndex
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-start transition-colors',
                        isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                        isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      )}>
                        {typeIcons[item.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      {isActive && <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="bg-muted border rounded px-1 py-0.5">&uarr;</kbd><kbd className="bg-muted border rounded px-1 py-0.5">&darr;</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted border rounded px-1 py-0.5">&crarr;</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="bg-muted border rounded px-1 py-0.5">esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
