'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { LeadsTable } from './leads-table'
import { LeadsKanban } from './leads-kanban'
import { LeadFormDialog } from './lead-form-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, List, LayoutGrid, Download } from 'lucide-react'

export function LeadsContent() {
  const t = useTranslations('leads')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetch('/api/leads').then(r => r.json()),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${data?.total ?? 0} ${t('allLeads').toLowerCase()}`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" />
          {t('export') || 'Export'}
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('newLead')}
        </Button>
      </PageHeader>

      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'kanban')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-4 w-4" />
              {t('listView')}
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              {t('kanbanView')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-4">
          <LeadsTable />
        </TabsContent>
        <TabsContent value="kanban" className="mt-4">
          <LeadsKanban />
        </TabsContent>
      </Tabs>

      <LeadFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
