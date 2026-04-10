'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { CommunicationLogFormDialog } from './communication-log-form-dialog'
import { CommunicationTimeline } from './communication-timeline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Phone, Mail, MessageSquare, Users, StickyNote,
  ArrowDownLeft, ArrowUpRight, Trash2, Smartphone, List, GitBranch,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CommunicationLog {
  id: string
  type: string
  direction: string
  subject: string | null
  body: string | null
  durationSeconds: number | null
  loggedAt: string
  createdAt: string
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

const typeColors: Record<string, string> = {
  CALL: 'bg-blue-50 text-blue-700 border-blue-200',
  EMAIL: 'bg-purple-50 text-purple-700 border-purple-200',
  WHATSAPP: 'bg-green-50 text-green-700 border-green-200',
  MEETING: 'bg-amber-50 text-amber-700 border-amber-200',
  NOTE: 'bg-gray-50 text-gray-600 border-gray-200',
  SMS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
}

const typeIconBg: Record<string, string> = {
  CALL: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  WHATSAPP: 'bg-green-100 text-green-600',
  MEETING: 'bg-amber-100 text-amber-600',
  NOTE: 'bg-gray-100 text-gray-500',
  SMS: 'bg-cyan-100 text-cyan-600',
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

type FilterType = 'all' | string
type ViewMode = 'list' | 'timeline'

export function CommunicationLogContent() {
  const [showCreate, setShowCreate] = useState(false)
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [directionFilter, setDirectionFilter] = useState<FilterType>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const queryClient = useQueryClient()

  const params = new URLSearchParams()
  if (typeFilter !== 'all') params.set('type', typeFilter)
  if (directionFilter !== 'all') params.set('direction', directionFilter)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const { data, isLoading } = useQuery({
    queryKey: ['communication-logs', typeFilter, directionFilter, dateFrom, dateTo],
    queryFn: () => fetch(`/api/communication-logs?${params}`).then(r => r.json()),
  })

  const logs: CommunicationLog[] = data?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/communication-logs/${id}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] })
      toast.success('Log deleted')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const types = ['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'SMS']

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Communication Log" description={`${logs.length} interactions`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" />
          Log Interaction
        </Button>
      </PageHeader>

      {/* Filters row */}
      <div className="space-y-3">
        {/* Type filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground min-w-[60px]">Type:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                typeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border'
              )}
            >
              All
            </button>
            {types.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                  typeFilter === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border'
                )}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Direction + Date + View toggle */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Direction:</span>
            <div className="flex gap-1">
              {['all', 'INBOUND', 'OUTBOUND'].map(d => (
                <button
                  key={d}
                  onClick={() => setDirectionFilter(d)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                    directionFilter === d ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-transparent hover:border-border'
                  )}
                >
                  {d === 'all' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="h-7 w-36 text-xs"
            />
            <span className="text-sm text-muted-foreground">To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="h-7 w-36 text-xs"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="ms-auto flex items-center border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'timeline' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : viewMode === 'timeline' ? (
        <CommunicationTimeline logs={logs} />
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No communication logs</h3>
          <p className="text-sm text-muted-foreground mb-4">Track calls, emails, meetings and more.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 me-2" />
            Log Interaction
          </Button>
        </div>
      ) : (
        /* List view */
        <div className="relative">
          <div className="absolute start-9 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {logs.map((log) => {
              const TypeIcon = typeIcons[log.type] ?? MessageSquare
              const iconBg = typeIconBg[log.type] ?? 'bg-gray-100 text-gray-500'
              const typeColor = typeColors[log.type] ?? ''
              const isInbound = log.direction === 'INBOUND'

              return (
                <div key={log.id} className="flex gap-4 relative">
                  <div className={cn('relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm', iconBg)}>
                    <TypeIcon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 rounded-lg border bg-card shadow-sm p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs font-medium', typeColor)}>
                          {log.type}
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
                          {isInbound ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {isInbound ? 'Inbound' : 'Outbound'}
                        </Badge>
                        {log.durationSeconds && (
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(log.durationSeconds)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.loggedAt), 'MMM d, yyyy HH:mm')}
                        </span>
                        <button
                          onClick={() => deleteMutation.mutate(log.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {log.subject && (
                      <p className="font-medium text-sm">{log.subject}</p>
                    )}
                    {log.body && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{log.body}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t">
                      {log.company && (
                        <span><span className="font-medium text-foreground">Company:</span> {log.company.displayName}</span>
                      )}
                      {log.contact && (
                        <span><span className="font-medium text-foreground">Contact:</span> {log.contact.firstName} {log.contact.lastName}</span>
                      )}
                      {log.lead && (
                        <span><span className="font-medium text-foreground">Lead:</span> {log.lead.fullName}</span>
                      )}
                      {log.loggedBy && (
                        <span><span className="font-medium text-foreground">Logged by:</span> {log.loggedBy.firstName} {log.loggedBy.lastName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CommunicationLogFormDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
