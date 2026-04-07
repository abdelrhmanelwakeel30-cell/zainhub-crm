'use client'

import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { CampaignsTable } from './campaigns-table'
import { Button } from '@/components/ui/button'
import { Plus, Download, Megaphone, Zap, DollarSign, Users } from 'lucide-react'
import { campaigns } from '@/lib/demo-data'

export function CampaignsContent() {
  const t = useTranslations('campaigns')

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0)

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${campaigns.length} campaigns`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" /> Export
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4 me-2" /> {t('newCampaign')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalCampaigns')} value={campaigns.length} icon={<Megaphone className="h-5 w-5" />} />
        <KPICard title={t('activeCampaigns')} value={activeCampaigns.length} icon={<Zap className="h-5 w-5" />} />
        <KPICard title={t('totalBudget')} value={`${(totalBudget / 1000).toFixed(0)}K`} prefix="AED " icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title={t('leadsGenerated')} value={totalLeads} icon={<Users className="h-5 w-5" />} />
      </div>

      <CampaignsTable />
    </div>
  )
}
