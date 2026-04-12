'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, DollarSign, Users, Target,
  CalendarDays, Megaphone, Globe, TrendingUp
} from 'lucide-react'

interface CampaignDetailProps {
  campaignId: string
}

type CampaignDetail = {
  id: string
  name: string
  type: string
  platform?: string
  status: string
  startDate: string
  endDate: string
  budget: number
  actualSpend: number
  leads?: number | { count: number }
  impressions?: number
  clicks?: number
  conversions?: number
  description?: string
  revenueGenerated?: number
  leadsGenerated?: number
  opportunitiesCreated?: number
  createdAt?: string
  owner?: { firstName: string; lastName: string }
}

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const t = useTranslations('campaigns')
  const tc = useTranslations('common')
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaigns', campaignId],
    queryFn: () => fetch('/api/campaigns/' + campaignId).then(r => r.json()),
  })

  const campaign: CampaignDetail | undefined = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to campaigns" onClick={() => router.push('/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Campaign not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/campaigns')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Campaigns
        </Button>
      </div>
    )
  }

  const leadsCount = typeof campaign.leads === 'number'
    ? campaign.leads
    : (campaign.leads as { count?: number })?.count ?? campaign.leadsGenerated ?? 0

  const revenueGenerated = campaign.revenueGenerated ?? 0
  const actualSpend = campaign.actualSpend ?? 0

  const roi = actualSpend > 0
    ? (((revenueGenerated - actualSpend) / actualSpend) * 100).toFixed(0)
    : '0'
  const budgetUtilization = campaign.budget > 0
    ? Math.round((actualSpend / campaign.budget) * 100)
    : 0

  const ownerName = campaign.owner
    ? `${campaign.owner.firstName} ${campaign.owner.lastName}`
    : null

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to campaigns" onClick={() => router.push('/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {campaign.type.replace(/_/g, ' ')}{campaign.createdAt ? ` · Created ${formatRelativeDate(campaign.createdAt)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 me-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t('budget')}</p>
                  <p className="text-xl font-bold mt-1">AED {campaign.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('actualSpend')}</p>
                  <p className="text-xl font-bold mt-1">AED {actualSpend.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('leadsGenerated')}</p>
                  <p className="text-xl font-bold mt-1">{leadsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('opportunities')}</p>
                  <p className="text-xl font-bold mt-1">{campaign.opportunitiesCreated ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Megaphone className="h-4 w-4" />} label={t('type')} value={campaign.type.replace(/_/g, ' ')} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label={t('platform')} value={campaign.platform || '-'} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label={t('budget')} value={`AED ${campaign.budget.toLocaleString()}`} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label={t('actualSpend')} value={`AED ${actualSpend.toLocaleString()}`} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={t('startDate')} value={formatDate(campaign.startDate)} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={t('endDate')} value={formatDate(campaign.endDate)} />
                <InfoRow icon={<Users className="h-4 w-4" />} label={t('leadsGenerated')} value={String(leadsCount)} />
                {campaign.impressions != null && (
                  <InfoRow icon={<TrendingUp className="h-4 w-4" />} label="Impressions" value={campaign.impressions.toLocaleString()} />
                )}
                {campaign.clicks != null && (
                  <InfoRow icon={<Target className="h-4 w-4" />} label="Clicks" value={campaign.clicks.toLocaleString()} />
                )}
                {campaign.conversions != null && (
                  <InfoRow icon={<Target className="h-4 w-4" />} label="Conversions" value={campaign.conversions.toLocaleString()} />
                )}
              </div>
              {campaign.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{campaign.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Owner */}
          {ownerName && (
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
                    <p className="text-xs text-muted-foreground">{t('owner')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ROI & Performance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ROI</span>
                <span className="text-sm font-semibold">{roi}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Budget Used</span>
                <span className="text-sm font-semibold">{budgetUtilization}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="text-sm font-semibold">AED {revenueGenerated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cost per Lead</span>
                <span className="text-sm font-semibold">
                  {leadsCount > 0
                    ? `AED ${Math.round(actualSpend / leadsCount).toLocaleString()}`
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('status')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={campaign.status} />
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
