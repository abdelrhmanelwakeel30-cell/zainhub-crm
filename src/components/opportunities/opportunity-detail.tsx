'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Edit, Building2, UserCircle, DollarSign,
  Target, CalendarDays, Briefcase, TrendingUp, FileText, AlertTriangle,
  CheckCircle, XCircle,
} from 'lucide-react'

interface OpportunityDetailProps {
  opportunityId: string
}

interface Opportunity {
  id: string
  opportunityNumber: string
  title: string
  company?: { id: string; displayName: string } | null
  primaryContact?: { id: string; firstName: string; lastName: string } | null
  stage?: { name: string; color?: string } | null
  expectedValue: number
  weightedValue: number
  probability: number
  expectedCloseDate?: string | null
  owner: { firstName: string; lastName: string }
  description?: string | null
  createdAt: string
  wonAt?: string | null
  lostAt?: string | null
  lostReason?: { name: string } | null
  lead?: { id: string; leadNumber: string; fullName: string } | null
  opportunityServices?: { service: { id: string; name: string } }[]
  quotations?: { id: string; quotationNumber: string; totalAmount: number; status: string }[]
  projects?: { id: string; name: string; status: string }[]
}

const lostReasonOptions = [
  'Went with competitor',
  'Budget constraints',
  'Timing not right',
  'Requirements changed',
  'No response / Ghost',
  'Internal decision',
  'Bad fit',
  'Other',
]

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const t = useTranslations('opportunities')
  const tc = useTranslations('common')
  const router = useRouter()
  const [showWonDialog, setShowWonDialog] = useState(false)
  const [showLostDialog, setShowLostDialog] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [lostNotes, setLostNotes] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', opportunityId],
    queryFn: () => fetch(`/api/opportunities/${opportunityId}`).then(r => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-28 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-muted rounded" />
            <div className="h-28 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  const opp: Opportunity | undefined = data?.data

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Opportunity not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/opportunities')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Opportunities
        </Button>
      </div>
    )
  }

  const stageName = opp.stage?.name ?? ''
  const isWon = stageName === 'Closed Won'
  const isLost = stageName === 'Closed Lost'
  const isClosed = isWon || isLost

  const ownerName = `${opp.owner.firstName} ${opp.owner.lastName}`
  const contactName = opp.primaryContact ? `${opp.primaryContact.firstName} ${opp.primaryContact.lastName}` : null

  const relatedQuotations = opp.quotations ?? []
  const relatedProjects = opp.projects ?? []

  const handleMarkWon = async () => {
    toast.success('Deal marked as Won! Contract and Project will be created.')
    setShowWonDialog(false)
    router.push('/opportunities')
  }

  const handleMarkLost = async () => {
    if (!lostReason) {
      toast.error('Please select a reason for losing this deal.')
      return
    }
    toast.success('Deal marked as Lost. Reason recorded.')
    setShowLostDialog(false)
    router.push('/opportunities')
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to opportunities" onClick={() => router.push('/opportunities')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{opp.title}</h1>
              {stageName && <StatusBadge status={stageName} />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {opp.opportunityNumber} · {opp.company?.displayName} · Created {formatRelativeDate(opp.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => setShowWonDialog(true)}
              >
                <CheckCircle className="h-4 w-4 me-2" />
                Mark Won
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setShowLostDialog(true)}
              >
                <XCircle className="h-4 w-4 me-2" />
                Mark Lost
              </Button>
            </>
          )}
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 me-2" /> Edit
          </Button>
        </div>
      </div>

      {/* Lost Reason Banner */}
      {isLost && opp.lostReason && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Lost Reason: {opp.lostReason?.name}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t('value')}</p>
                  <p className="text-xl font-bold mt-1">AED {opp.expectedValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weighted Value</p>
                  <p className="text-xl font-bold mt-1">AED {opp.weightedValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('probability')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={opp.probability} className="h-2 flex-1" />
                    <span className="text-sm font-semibold">{opp.probability}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('expectedCloseDate')}</p>
                  <p className="text-sm font-medium mt-1">
                    {opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">{tc('details')}</TabsTrigger>
              <TabsTrigger value="related">Related ({relatedQuotations.length + relatedProjects.length})</TabsTrigger>
              <TabsTrigger value="timeline">{tc('timeline')}</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={<Building2 className="h-4 w-4" />} label={t('company')} value={opp.company?.displayName} href={opp.company ? `/companies/${opp.company.id}` : undefined} />
                    <InfoRow icon={<UserCircle className="h-4 w-4" />} label={t('contact')} value={contactName} href={opp.primaryContact ? `/contacts/${opp.primaryContact.id}` : undefined} />
                    <InfoRow icon={<Briefcase className="h-4 w-4" />} label={t('services')} value={opp.opportunityServices?.map(os => os.service.name).join(', ') ?? '-'} />
                    <InfoRow icon={<Target className="h-4 w-4" />} label={t('stage')} value={stageName} />
                    <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Created" value={formatDate(opp.createdAt)} />
                    {opp.wonAt && <InfoRow icon={<TrendingUp className="h-4 w-4" />} label={t('wonDate')} value={formatDate(opp.wonAt)} />}
                    {opp.lostAt && <InfoRow icon={<TrendingUp className="h-4 w-4" />} label={t('lostDate')} value={formatDate(opp.lostAt)} />}
                    {opp.lead && (
                      <InfoRow
                        icon={<Target className="h-4 w-4" />}
                        label="Source Lead"
                        value={`${opp.lead.leadNumber} · ${opp.lead.fullName}`}
                        href={`/leads/${opp.lead.id}`}
                      />
                    )}
                  </div>
                  {opp.description && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{opp.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related" className="mt-4 space-y-4">
              {/* Related Quotations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quotations ({relatedQuotations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedQuotations.length > 0 ? (
                    <div className="space-y-3">
                      {relatedQuotations.map(q => (
                        <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{q.quotationNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              AED {Number(q.totalAmount ?? 0).toLocaleString()}
                            </p>
                          </div>
                          <StatusBadge status={q.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No quotations linked to this opportunity.</p>
                  )}
                </CardContent>
              </Card>

              {/* Related Projects */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Projects ({relatedProjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {relatedProjects.length > 0 ? (
                    <div className="space-y-3">
                      {relatedProjects.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No projects linked to this opportunity.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { action: 'Opportunity created', detail: `AED ${opp.expectedValue.toLocaleString()}`, time: opp.createdAt },
                      ...(opp.wonAt ? [{ action: 'Deal won!', detail: `Closed at AED ${opp.expectedValue.toLocaleString()}`, time: opp.wonAt }] : []),
                      ...(opp.lostAt ? [{ action: 'Deal lost', detail: opp.lostReason?.name ? `Reason: ${opp.lostReason.name}` : 'Opportunity closed', time: opp.lostAt }] : []),
                    ].reverse().map((event, i, arr) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                          {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">{event.action}</p>
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(event.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('owner')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(ownerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{ownerName}</p>
                  <p className="text-xs text-muted-foreground">Deal Owner</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Stage */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('pipeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stageName && <StatusBadge status={stageName} />}
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={opp.probability} className="h-2" />
                  <span className="text-sm font-medium">{opp.probability}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deal Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected</span>
                <span className="text-sm font-semibold">AED {opp.expectedValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Weighted</span>
                <span className="text-sm font-semibold">AED {opp.weightedValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Probability</span>
                <span className="text-sm font-semibold">{opp.probability}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark Won Dialog */}
      <Dialog open={showWonDialog} onOpenChange={setShowWonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Mark Deal as Won
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Closing <strong>{opp.title}</strong> for <strong>AED {opp.expectedValue.toLocaleString()}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              This will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Mark this opportunity as Closed Won</li>
              <li>Create a contract for {opp.company?.displayName}</li>
              <li>Initiate project kickoff</li>
              <li>Generate the first invoice</li>
            </ul>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleMarkWon} className="bg-green-600 hover:bg-green-700">
              Confirm Won
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Lost Dialog */}
      <Dialog open={showLostDialog} onOpenChange={setShowLostDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Mark Deal as Lost
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Losing <strong>{opp.title}</strong> ({opp.company?.displayName}).
            </p>
            <div className="space-y-2">
              <Label>Lost Reason *</Label>
              <Select value={lostReason} onValueChange={(v) => v && setLostReason(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {lostReasonOptions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={lostNotes}
                onChange={(e) => setLostNotes(e.target.value)}
                placeholder="Any additional context..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleMarkLost} variant="destructive">
              Confirm Lost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {href && value ? (
          <Link href={href} className="text-sm font-medium text-blue-600 hover:underline">{value}</Link>
        ) : (
          <p className="text-sm font-medium">{value || '-'}</p>
        )}
      </div>
    </div>
  )
}
