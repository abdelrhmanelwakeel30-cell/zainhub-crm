'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Receipt, CalendarClock, FileText } from 'lucide-react'
import Link from 'next/link'
import { leads, invoices, contracts, tickets, quotations } from '@/lib/demo-data'

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

function computeUrgentItems(): UrgentItem[] {
  const items: UrgentItem[] = []
  const now = new Date()

  // Overdue follow-ups
  leads.forEach(lead => {
    if (lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < now && lead.stage !== 'Won' && lead.stage !== 'Lost') {
      const daysOverdue = Math.round((now.getTime() - new Date(lead.nextFollowUpAt).getTime()) / 86400000)
      items.push({
        id: `fu-${lead.id}`,
        type: 'follow-up',
        title: `Follow up with ${lead.fullName}`,
        subtitle: `${lead.companyName || 'No company'} - ${lead.interestedService}`,
        dueLabel: `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
        icon: Clock,
        color: 'text-red-600',
        href: `/leads/${lead.id}`,
      })
    }
  })

  // Upcoming follow-ups (next 2 days)
  leads.forEach(lead => {
    if (lead.nextFollowUpAt && lead.stage !== 'Won' && lead.stage !== 'Lost') {
      const followUpDate = new Date(lead.nextFollowUpAt)
      const daysUntil = Math.round((followUpDate.getTime() - now.getTime()) / 86400000)
      if (daysUntil >= 0 && daysUntil <= 2) {
        items.push({
          id: `fus-${lead.id}`,
          type: 'follow-up',
          title: `Follow up with ${lead.fullName}`,
          subtitle: `${lead.companyName || 'No company'} - ${lead.interestedService}`,
          dueLabel: daysUntil === 0 ? 'Due today' : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
          icon: CalendarClock,
          color: 'text-orange-600',
          href: `/leads/${lead.id}`,
        })
      }
    }
  })

  // Overdue invoices
  invoices.forEach(inv => {
    if (inv.status === 'OVERDUE') {
      const daysOverdue = Math.round((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000)
      items.push({
        id: `inv-${inv.id}`,
        type: 'invoice',
        title: `Invoice ${inv.invoiceNumber} overdue`,
        subtitle: `${inv.client.name} - AED ${inv.balanceDue.toLocaleString()}`,
        dueLabel: `${daysOverdue} days overdue`,
        icon: Receipt,
        color: 'text-red-600',
        href: `/invoices/${inv.id}`,
      })
    }
  })

  // Unassigned leads
  const unassigned = leads.filter(l => !l.assignedTo && l.stage !== 'Won' && l.stage !== 'Lost')
  if (unassigned.length > 0) {
    items.push({
      id: 'unassigned',
      type: 'lead',
      title: `${unassigned.length} unassigned lead${unassigned.length > 1 ? 's' : ''}`,
      subtitle: unassigned.map(l => l.leadNumber).join(', ') + ' need assignment',
      dueLabel: 'Pending',
      icon: AlertCircle,
      color: 'text-yellow-600',
      href: '/leads',
    })
  }

  // Expiring quotations (within 7 days)
  quotations.forEach(q => {
    if (q.status === 'SENT' || q.status === 'DRAFT') {
      const daysUntil = Math.round((new Date(q.validUntil).getTime() - now.getTime()) / 86400000)
      if (daysUntil >= 0 && daysUntil <= 7) {
        items.push({
          id: `quo-${q.id}`,
          type: 'quotation',
          title: `Quotation expiring: ${q.title}`,
          subtitle: `AED ${q.totalAmount.toLocaleString()} - ${q.company.name}`,
          dueLabel: daysUntil === 0 ? 'Expires today' : `Expires in ${daysUntil} days`,
          icon: FileText,
          color: 'text-orange-600',
          href: '/quotations',
        })
      }
    }
  })

  // Contract renewals (within 90 days)
  contracts.forEach(ctr => {
    if ('renewalDate' in ctr) {
      const renewalDate = new Date(String((ctr as unknown as Record<string, string>).renewalDate))
      const daysUntil = Math.round((renewalDate.getTime() - now.getTime()) / 86400000)
      if (daysUntil >= 0 && daysUntil <= 90) {
        items.push({
          id: `ctr-${ctr.id}`,
          type: 'contract',
          title: `Contract renewal: ${ctr.title}`,
          subtitle: `${ctr.client.name} - ${ctr.type}`,
          dueLabel: `Renewal in ${daysUntil} days`,
          icon: CalendarClock,
          color: 'text-amber-600',
          href: `/contracts/${ctr.id}`,
        })
      }
    }
  })

  // SLA-breaching tickets
  tickets.forEach(tkt => {
    if (tkt.slaDueAt && new Date(tkt.slaDueAt) < now && tkt.status !== 'RESOLVED' && tkt.status !== 'CLOSED') {
      items.push({
        id: `tkt-${tkt.id}`,
        type: 'ticket',
        title: `SLA breach: ${tkt.ticketNumber}`,
        subtitle: `${tkt.subject} - ${tkt.priority}`,
        dueLabel: 'SLA overdue',
        icon: AlertCircle,
        color: 'text-red-600',
        href: `/tickets/${tkt.id}`,
      })
    }
  })

  // Sort by severity (red items first)
  return items.sort((a, b) => {
    const severity: Record<string, number> = { 'text-red-600': 0, 'text-orange-600': 1, 'text-amber-600': 2, 'text-yellow-600': 3 }
    return (severity[a.color] ?? 4) - (severity[b.color] ?? 4)
  }).slice(0, 8)
}

export function UrgentItems() {
  const t = useTranslations('dashboard')
  const urgentItems = computeUrgentItems()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{t('urgentItems')}</CardTitle>
          <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            {urgentItems.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentItems.length > 0 ? urgentItems.map((item) => {
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
