'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Phone, Mail, Globe, Building2, CalendarClock, User, Target, DollarSign, ArrowRight, AlertTriangle } from 'lucide-react'

interface LeadDetailProps {
  leadId: string
}

export function LeadDetail({ leadId }: LeadDetailProps) {
  const t = useTranslations('leads')
  const tc = useTranslations('common')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showConvertDialog, setShowConvertDialog] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}`)
      if (!res.ok) throw new Error('Lead not found')
      return res.json()
    },
  })

  const convertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Failed to convert lead')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      setShowConvertDialog(false)
      toast.success('Lead converted successfully! Company, Contact, and Opportunity created.')
      router.push('/opportunities')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Lead not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/leads')}>
          <ArrowLeft className="h-4 w-4 me-2" />
          Back to Leads
        </Button>
      </div>
    )
  }

  const lead = data.data
  const isTerminal = lead.convertedAt || (lead.stage?.name === 'Lost')

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to leads" onClick={() => router.push('/leads')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.fullName}</h1>
              {lead.stage && <StatusBadge status={lead.stage.name} />}
              {lead.urgency && <StatusBadge status={lead.urgency} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lead.leadNumber} · {lead.companyName || 'No company'} · Created {formatRelativeDate(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 me-2" />
            Call
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 me-2" />
            Email
          </Button>
          {!isTerminal && (
            <Button size="sm" onClick={() => setShowConvertDialog(true)}>
              <ArrowRight className="h-4 w-4 me-2" />
              {t('convertLead')}
            </Button>
          )}
        </div>
      </div>

      {/* Lost reason banner */}
      {lead.lostReason && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Lost Reason</p>
            <p className="text-sm text-red-600 dark:text-red-400">{lead.lostReason.name}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Mail className="h-4 w-4" />} label={tc('email')} value={lead.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label={tc('phone')} value={lead.phone} />
                <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('companyName')} value={lead.companyName} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label={t('country')} value={[lead.city, lead.country].filter(Boolean).join(', ')} />
                <InfoRow icon={<Target className="h-4 w-4" />} label={t('interestedService')} value={lead.interestedService?.name} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label={t('budget')} value={lead.budgetRange} />
                <InfoRow icon={<User className="h-4 w-4" />} label={t('source')} value={lead.source?.name} />
                <InfoRow icon={<CalendarClock className="h-4 w-4" />} label={t('nextFollowUp')} value={lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : 'Not set'} />
              </div>
            </CardContent>
          </Card>

          {/* Activity Tabs */}
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">{tc('timeline')}</TabsTrigger>
              <TabsTrigger value="notes">{tc('notes')}</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {buildTimeline(lead).map((event, i, arr) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-2 w-2 rounded-full mt-2 ${event.type === 'lost' ? 'bg-red-600' : event.type === 'won' ? 'bg-green-600' : 'bg-blue-600'}`} />
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
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {lead.notes ? (
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('score')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <ScoreIndicator score={lead.score ?? 0} size="lg" />
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('assignedTo')}</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.assignedTo ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(`${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</p>
                    <p className="text-xs text-muted-foreground">Sales Team</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                  <Button variant="outline" size="sm" className="mt-2">Assign</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Stage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('pipeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.stage && <StatusBadge status={lead.stage.name} />}
              {lead.nextFollowUpAt && !isTerminal && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Next Follow-up</p>
                  <p className="text-sm font-medium mt-1">
                    {formatDate(lead.nextFollowUpAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Convert Lead Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert Lead to Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will create the following records from this lead:
            </p>
            <div className="space-y-2">
              {lead.companyName && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Company: <strong>{lead.companyName}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm">Contact: <strong>{lead.fullName}</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-purple-50 dark:bg-purple-950">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Opportunity: <strong>{lead.interestedService?.name || 'New Opportunity'}</strong></span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Lead source, score, budget, and qualification data will be preserved on the new opportunity.
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
              {convertMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Convert Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

type TimelineEvent = { action: string; detail: string; time: string; type?: string }

function buildTimeline(lead: Record<string, any>): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { action: 'Lead created', detail: `Source: ${lead.source?.name ?? 'Unknown'}`, time: lead.createdAt, type: 'create' },
  ]
  if (lead.lastContactedAt) {
    events.push({ action: 'Last contacted', detail: '', time: lead.lastContactedAt, type: 'contact' })
  }
  if (lead.convertedAt) {
    events.push({ action: 'Lead converted', detail: 'Converted to Opportunity', time: lead.convertedAt, type: 'won' })
  }
  if (lead.lostAt) {
    events.push({ action: 'Lead marked as lost', detail: lead.lostReason?.name ? `Reason: ${lead.lostReason.name}` : '', time: lead.lostAt, type: 'lost' })
  }
  return events.reverse()
}
