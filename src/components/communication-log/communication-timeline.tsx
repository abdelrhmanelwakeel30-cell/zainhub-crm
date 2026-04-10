'use client'

import { Badge } from '@/components/ui/badge'
import {
  Phone, Mail, MessageSquare, Users, StickyNote,
  ArrowDownLeft, ArrowUpRight, Smartphone
} from 'lucide-react'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { cn } from '@/lib/utils'

interface CommunicationLog {
  id: string
  type: string
  direction: string
  subject: string | null
  body: string | null
  durationSeconds: number | null
  loggedAt: string
  company: { id: string; displayName: string } | null
  contact: { id: string; firstName: string; lastName: string } | null
  lead: { id: string; fullName: string } | null
  loggedBy: { id: string; firstName: string; lastName: string } | null
}

const typeIcons: Record<string, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  MEETING: Users,
  NOTE: StickyNote,
  SMS: Smartphone,
}

const typeIconBg: Record<string, string> = {
  CALL: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  WHATSAPP: 'bg-green-100 text-green-600',
  MEETING: 'bg-amber-100 text-amber-600',
  NOTE: 'bg-gray-100 text-gray-500',
  SMS: 'bg-cyan-100 text-cyan-600',
}

const typeColors: Record<string, string> = {
  CALL: 'bg-blue-50 text-blue-700 border-blue-200',
  EMAIL: 'bg-purple-50 text-purple-700 border-purple-200',
  WHATSAPP: 'bg-green-50 text-green-700 border-green-200',
  MEETING: 'bg-amber-50 text-amber-700 border-amber-200',
  NOTE: 'bg-gray-50 text-gray-600 border-gray-200',
  SMS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'This Week'
  return 'Earlier'
}

interface Props {
  logs: CommunicationLog[]
}

export function CommunicationTimeline({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No communication logs</h3>
        <p className="text-sm text-muted-foreground">Adjust filters or log a new interaction.</p>
      </div>
    )
  }

  // Group by date label
  const groups: Record<string, CommunicationLog[]> = {}
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

  for (const log of logs) {
    const group = getDateGroup(log.loggedAt)
    if (!groups[group]) groups[group] = []
    groups[group].push(log)
  }

  return (
    <div className="space-y-8">
      {groupOrder.filter(g => groups[g]?.length).map(group => (
        <div key={group}>
          {/* Group heading */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Timeline entries */}
          <div className="relative">
            <div className="absolute start-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {groups[group].map((log) => {
                const TypeIcon = typeIcons[log.type] ?? MessageSquare
                const iconBg = typeIconBg[log.type] ?? 'bg-gray-100 text-gray-500'
                const typeColor = typeColors[log.type] ?? ''
                const isInbound = log.direction === 'INBOUND'

                return (
                  <div key={log.id} className="flex gap-4 relative">
                    {/* Icon dot */}
                    <div className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm',
                      iconBg
                    )}>
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 rounded-lg border bg-card shadow-sm p-3.5 space-y-1.5 mb-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={cn('text-xs font-medium', typeColor)}>
                            {log.type.charAt(0) + log.type.slice(1).toLowerCase()}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-medium flex items-center gap-1',
                              isInbound
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            )}
                          >
                            {isInbound
                              ? <ArrowDownLeft className="h-3 w-3" />
                              : <ArrowUpRight className="h-3 w-3" />
                            }
                            {isInbound ? 'Inbound' : 'Outbound'}
                          </Badge>
                          {log.durationSeconds && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(log.durationSeconds)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(log.loggedAt), 'HH:mm')}
                        </span>
                      </div>

                      {log.subject && (
                        <p className="font-medium text-sm">{log.subject}</p>
                      )}
                      {log.body && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{log.body}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t">
                        {log.company && (
                          <span>
                            <span className="font-medium text-foreground">Company:</span> {log.company.displayName}
                          </span>
                        )}
                        {log.contact && (
                          <span>
                            <span className="font-medium text-foreground">Contact:</span> {log.contact.firstName} {log.contact.lastName}
                          </span>
                        )}
                        {log.lead && (
                          <span>
                            <span className="font-medium text-foreground">Lead:</span> {log.lead.fullName}
                          </span>
                        )}
                        {log.loggedBy && (
                          <span>
                            <span className="font-medium text-foreground">By:</span> {log.loggedBy.firstName} {log.loggedBy.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
