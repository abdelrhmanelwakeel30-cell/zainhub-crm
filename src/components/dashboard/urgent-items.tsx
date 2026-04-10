'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Clock, Receipt, CalendarClock, FileText, HeadphonesIcon } from 'lucide-react'
import Link from 'next/link'

type UrgentItem = {
  id: string
  type: string
  title: string
  subtitle: string
  dueLabel: string
  icon: typeof Clock
  color: string
  href: string
}

export function UrgentItems() {
  const t = useTranslations('dashboard')
  const now = new Date()

  const { data: invoicesData, isLoading: invLoading } = useQuery({
    queryKey: ['invoices', 'overdue'],
    queryFn: () => fetch('/api/invoices?status=OVERDUE&pageSize=5').then(r => r.json()),
    staleTime: 60_000,
  })

  const { data: tasksData, isLoading: taskLoading } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => fetch('/api/tasks?pageSize=10').then(r => r.json()),
    staleTime: 60_000,
  })

  const { data: ticketsData, isLoading: ticketLoading } = useQuery({
    queryKey: ['tickets', 'open'],
    queryFn: () => fetch('/api/tickets?pageSize=5').then(r => r.json()),
    staleTime: 60_000,
  })

  const isLoading = invLoading || taskLoading || ticketLoading

  const urgentItems: UrgentItem[] = []

  // Overdue invoices
  const overdueInvoices: Array<{ id: string; invoiceNumber: string; client?: { displayName: string }; balanceDue: number; dueDate: string }> = invoicesData?.data ?? []
  overdueInvoices.forEach(inv => {
    const daysOverdue = Math.max(0, Math.round((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000))
    urgentItems.push({
      id: `inv-${inv.id}`,
      type: 'invoice',
      title: `Invoice ${inv.invoiceNumber} overdue`,
      subtitle: `${inv.client?.displayName ?? '—'} - AED ${Number(inv.balanceDue).toLocaleString()}`,
      dueLabel: `${daysOverdue}d overdue`,
      icon: Receipt,
      color: 'text-red-600',
      href: `/invoices/${inv.id}`,
    })
  })

  // Overdue tasks
  const allTasks: Array<{ id: string; taskNumber: string; title: string; status: string; dueDate?: string; project?: { name: string } }> = tasksData?.data ?? []
  allTasks
    .filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .slice(0, 3)
    .forEach(task => {
      const daysOverdue = Math.max(0, Math.round((now.getTime() - new Date(task.dueDate!).getTime()) / 86400000))
      urgentItems.push({
        id: `tsk-${task.id}`,
        type: 'task',
        title: task.title,
        subtitle: task.project?.name ?? 'No project',
        dueLabel: `${daysOverdue}d overdue`,
        icon: Clock,
        color: 'text-orange-600',
        href: `/tasks/${task.id}`,
      })
    })

  // Open/breached tickets
  const openTickets: Array<{ id: string; ticketNumber: string; subject: string; priority: string; slaDueAt?: string; status: string; client?: { displayName: string } }> = ticketsData?.data ?? []
  openTickets
    .filter(t => t.slaDueAt && new Date(t.slaDueAt) < now)
    .slice(0, 3)
    .forEach(ticket => {
      urgentItems.push({
        id: `tkt-${ticket.id}`,
        type: 'ticket',
        title: `SLA breach: ${ticket.ticketNumber}`,
        subtitle: `${ticket.subject} — ${ticket.priority}`,
        dueLabel: 'SLA overdue',
        icon: HeadphonesIcon,
        color: 'text-red-600',
        href: `/tickets/${ticket.id}`,
      })
    })

  const sorted = urgentItems.sort((a, b) => {
    const severity: Record<string, number> = { 'text-red-600': 0, 'text-orange-600': 1, 'text-amber-600': 2, 'text-yellow-600': 3 }
    return (severity[a.color] ?? 4) - (severity[b.color] ?? 4)
  }).slice(0, 8)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{t('urgentItems')}</CardTitle>
          {!isLoading && (
            <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
              {sorted.length} items
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="h-4 w-4 mt-0.5 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))
        ) : sorted.length > 0 ? sorted.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start gap-3 rounded-lg p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {item.dueLabel}
              </Badge>
            </Link>
          )
        }) : (
          <p className="text-sm text-muted-foreground text-center py-4">No urgent items</p>
        )}
      </CardContent>
    </Card>
  )
}
