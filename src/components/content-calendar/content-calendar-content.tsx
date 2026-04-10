'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { Plus, Download, Calendar, CheckCircle, Clock, Eye } from 'lucide-react'

interface ContentItem {
  id: string
  platform: string
  contentType: string
  approvalStatus: string
  plannedPublishDate: string | null
  caption: string | null
  socialAccount: { accountName: string; platform: string } | null
  campaign: { name: string } | null
}

interface ContentItemsApiResponse {
  success: boolean
  data: ContentItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function ContentCalendarContent() {
  const t = useTranslations('common')

  const { data: response } = useQuery<ContentItemsApiResponse>({
    queryKey: ['content-items'],
    queryFn: () => fetch('/api/content-items').then(r => r.json()),
  })

  const contentItems = response?.data ?? []

  const published = contentItems.filter(c => c.approvalStatus === 'PUBLISHED')
  const pending = contentItems.filter(c => ['DRAFT', 'INTERNAL_REVIEW', 'CLIENT_REVIEW'].includes(c.approvalStatus))
  const approved = contentItems.filter(c => ['APPROVED', 'SCHEDULED'].includes(c.approvalStatus))

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('contentCalendar')} description={`${contentItems.length} content items`}>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> {t('export')}</Button>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> {t('add')}</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('total')} value={contentItems.length} icon={<Calendar className="h-5 w-5" />} />
        <KPICard title={t('published')} value={published.length} icon={<CheckCircle className="h-5 w-5" />} />
        <KPICard title={t('pendingReview')} value={pending.length} icon={<Clock className="h-5 w-5" />} />
        <KPICard title={t('readyToPublish')} value={approved.length} icon={<Eye className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contentItems.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.platform} />
                  <StatusBadge status={item.contentType} />
                </div>
                <StatusBadge status={item.approvalStatus.replace(/_/g, ' ')} />
              </div>
              <p className="text-sm font-medium line-clamp-2 mb-2">{item.caption || 'No caption'}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.plannedPublishDate ? formatDate(item.plannedPublishDate) : 'No date'}</span>
                <span>{item.socialAccount?.accountName ?? item.campaign?.name ?? '-'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
