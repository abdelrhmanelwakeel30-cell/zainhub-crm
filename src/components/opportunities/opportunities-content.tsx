'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { OpportunitiesTable } from './opportunities-table'
import { OpportunityFormDialog } from './opportunity-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, DollarSign, Target, TrendingUp, Handshake, LayoutGrid, List } from 'lucide-react'
import { OpportunitiesKanban } from './opportunities-kanban'
import { toast } from 'sonner'

export function OpportunitiesContent() {
  const t = useTranslations('opportunities')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  const { data } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => fetch('/api/opportunities').then(r => r.json()),
  })

  const opportunities: any[] = data?.data ?? []

  const activeOpps = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage?.name ?? ''))
  const totalValue = activeOpps.reduce((sum, o) => sum + (o.expectedValue ?? 0), 0)
  const totalWeighted = activeOpps.reduce((sum, o) => sum + (o.weightedValue ?? 0), 0)
  const closedOpps = opportunities.filter(o => ['Closed Won', 'Closed Lost'].includes(o.stage?.name ?? ''))
  const wonDeals = opportunities.filter(o => o.stage?.name === 'Closed Won')
  const winRate = closedOpps.length > 0 ? Math.round((wonDeals.length / closedOpps.length) * 100) : 0

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${data?.total ?? 0} opportunities`}>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none"
            onClick={() => setViewMode('kanban')}
            aria-label="Kanban view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('Export started')}>
          <Download className="h-4 w-4 me-2" /> Export
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> {t('newOpportunity')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('activeDeals')} value={activeOpps.length} icon={<Handshake className="h-5 w-5" />} />
        <KPICard title={t('totalValue')} value={`${(totalValue / 1000).toFixed(0)}K`} prefix="AED " icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="Weighted Value" value={`${(totalWeighted / 1000).toFixed(0)}K`} prefix="AED " icon={<Target className="h-5 w-5" />} />
        <KPICard title={t('winRate')} value={`${winRate}%`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {viewMode === 'table' ? <OpportunitiesTable /> : <OpportunitiesKanban />}

      <OpportunityFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
