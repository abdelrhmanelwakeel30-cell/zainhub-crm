'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink } from 'lucide-react'

interface SocialAccount {
  id: string
  accountName: string
  platform: string
  handle: string | null
  followersCount: number
  isActive: boolean
  client: { displayName: string } | null
}

interface SocialAccountsApiResponse {
  success: boolean
  data: SocialAccount[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function SocialAccountsContent() {
  const t = useTranslations('common')

  const { data: response } = useQuery<SocialAccountsApiResponse>({
    queryKey: ['social-accounts'],
    queryFn: () => fetch('/api/social-accounts').then(r => r.json()),
  })

  const socialAccounts = response?.data ?? []
  const activeCount = socialAccounts.filter(a => a.isActive).length

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('socialAccounts')} description={`${socialAccounts.length} ${t('connectedAccounts').toLowerCase()}`}>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> {t('connectAccount')}</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('total')} value={socialAccounts.length} icon={<ExternalLink className="h-5 w-5" />} />
        <KPICard title={t('active')} value={activeCount} icon={<ExternalLink className="h-5 w-5" />} />
        <KPICard title={t('inactive')} value={socialAccounts.length - activeCount} icon={<ExternalLink className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialAccounts.map(account => (
          <Card key={account.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <StatusBadge status={account.platform} />
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="font-medium text-sm">{account.accountName}</p>
              <p className="text-xs text-muted-foreground mt-1">{account.client?.displayName ?? '-'}</p>
              {account.handle && (
                <p className="text-xs text-muted-foreground mt-2">@{account.handle}</p>
              )}
              {account.followersCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{account.followersCount.toLocaleString()} followers</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
