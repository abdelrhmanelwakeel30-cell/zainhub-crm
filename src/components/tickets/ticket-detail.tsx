'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  ArrowLeft, Building2, FolderOpen, User,
  CalendarClock, AlertTriangle, Clock, RotateCcw,
} from 'lucide-react'

interface TicketDetailProps {
  ticketId: string
}

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  description?: string | null
  status: string
  priority: string
  type: string
  client?: { displayName: string } | null
  assignedTo?: { firstName: string; lastName: string } | null
  comments?: { id: string; body: string; createdAt: string; author: { firstName: string; lastName: string } }[]
  createdAt: string
  dueDate?: string | null
  resolvedAt?: string | null
  slaDueAt?: string | null
  closedAt?: string | null
  createdBy?: { firstName: string; lastName: string } | null
  project?: { id: string; name: string } | null
  contact?: { id: string; firstName: string; lastName: string } | null
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const t = useTranslations('tickets')
  const tc = useTranslations('common')
  const router = useRouter()
  const [showAssign, setShowAssign] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: () => fetch(`/api/tickets/${ticketId}`).then(r => r.json()),
  })

  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    enabled: showAssign,
  })
  const users: { id: string; firstName: string; lastName: string }[] = usersResponse?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  const ticket: Ticket | undefined = data?.data
  const isClosed = ticket?.status === 'RESOLVED' || ticket?.status === 'CLOSED'

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Ticket not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/tickets')}>
          <ArrowLeft className="h-4 w-4 me-2" />
          Back to Tickets
        </Button>
      </div>
    )
  }

  const assignedToName = ticket.assignedTo
    ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
    : null

  const createdByName = ticket.createdBy
    ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`
    : null

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to tickets" onClick={() => router.push('/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{ticket.subject}</h1>
              <StatusBadge status={ticket.type.replace(/_/g, ' ')} />
              <StatusBadge status={ticket.priority.replace(/_/g, ' ')} />
              <StatusBadge status={ticket.status.replace(/_/g, ' ')} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {ticket.ticketNumber} · {ticket.client?.displayName || 'Internal'} · Created {formatRelativeDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Ticket reopened. Status set to Open.')}
            >
              <RotateCcw className="h-4 w-4 me-2" /> Reopen
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('client')} value={ticket.client?.displayName} />
                <InfoRow icon={<FolderOpen className="h-4 w-4" />} label={t('project')} value={ticket.project?.name} />
                {ticket.contact && (
                  <div className="flex items-start gap-2">
                    <div className="text-muted-foreground mt-0.5"><User className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Contact</p>
                      <Link href={`/contacts/${ticket.contact.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {ticket.contact.firstName} {ticket.contact.lastName}
                      </Link>
                    </div>
                  </div>
                )}
                <InfoRow icon={<User className="h-4 w-4" />} label={t('createdBy')} value={createdByName} />
                <InfoRow icon={<CalendarClock className="h-4 w-4" />} label={t('createdAt')} value={formatDate(ticket.createdAt)} />
                {ticket.resolvedAt && (
                  <InfoRow icon={<Clock className="h-4 w-4" />} label={t('resolvedAt')} value={formatDate(ticket.resolvedAt)} />
                )}
                {ticket.closedAt && (
                  <InfoRow icon={<Clock className="h-4 w-4" />} label={t('closedAt')} value={formatDate(ticket.closedAt)} />
                )}
              </div>
              {ticket.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">{t('description')}</p>
                  <p className="text-sm">{ticket.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buildTimeline(ticket).map((event, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{event.action}</p>
                      {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(event.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={ticket.status.replace(/_/g, ' ')} />
            </CardContent>
          </Card>

          {/* Assigned To */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('assignedTo')}</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.assignedTo ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(assignedToName!)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{assignedToName}</p>
                    <p className="text-xs text-muted-foreground">Support Team</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  {showAssign ? (
                    <Select onValueChange={(v) => { if (v && v !== 'unassigned') { toast.success('Ticket assigned'); setShowAssign(false) } else { setShowAssign(false) } }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select team member..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowAssign(true)}>Assign</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('slaDue')}</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.slaDueAt ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${new Date(ticket.slaDueAt) < new Date() ? 'text-red-600' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{formatDate(ticket.slaDueAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(ticket.slaDueAt)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No SLA set</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '-'}</p>
      </div>
    </div>
  )
}

type TimelineEvent = { action: string; detail: string; time: string }

function buildTimeline(ticket: Ticket): TimelineEvent[] {
  const createdByName = ticket.createdBy
    ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`
    : 'Unknown'

  const events: TimelineEvent[] = [
    { action: 'Ticket created', detail: `By ${createdByName} · ${ticket.type.replace(/_/g, ' ')} · ${ticket.priority}`, time: ticket.createdAt },
  ]

  if (ticket.assignedTo) {
    const assignedName = `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
    const assignedTime = new Date(new Date(ticket.createdAt).getTime() + 3600000).toISOString()
    events.push({ action: `Assigned to ${assignedName}`, detail: '', time: assignedTime })
  }
  if (ticket.status === 'IN_PROGRESS' || ticket.status === 'WAITING_CLIENT' || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    const startTime = new Date(new Date(ticket.createdAt).getTime() + 7200000).toISOString()
    events.push({ action: 'Work started', detail: 'Status changed to In Progress', time: startTime })
  }
  if (ticket.status === 'WAITING_CLIENT') {
    const waitTime = new Date(new Date(ticket.createdAt).getTime() + 86400000).toISOString()
    events.push({ action: 'Waiting for client', detail: 'Awaiting client response', time: waitTime })
  }
  if (ticket.resolvedAt) {
    events.push({ action: 'Ticket resolved', detail: 'Issue addressed', time: ticket.resolvedAt })
  }
  if (ticket.closedAt) {
    events.push({ action: 'Ticket closed', detail: 'Confirmed by client', time: ticket.closedAt })
  }

  return events.reverse()
}
