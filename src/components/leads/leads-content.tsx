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
import { toast } from 'sonner'

export function LeadsContent() {
  const t = useTranslations('leads')
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data } = useQuery({
    queryKey: ['leads', 'count'],
    queryFn: () => fetch('/api/leads?pageSize=1').then(r => r.json()),
  })

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/leads?pageSize=1000')
      if (!res.ok) throw new Error('Export failed')
      const json = await res.json()
      const leads: Array<Record<string, unknown>> = json.data ?? []

      if (leads.length === 0) {
        toast.info('No leads to export')
        return
      }

      const headers = ['Lead #', 'Full Name', 'Company', 'Email', 'Phone', 'Stage', 'Source', 'Urgency', 'Score', 'Assigned To', 'Created At']
      const rows = leads.map((l: any) => [
        l.leadNumber ?? '',
        l.fullName ?? '',
        l.companyName ?? '',
        l.email ?? '',
        l.phone ?? '',
        l.stage?.name ?? '',
        l.source?.name ?? '',
        l.urgency ?? '',
        l.score ?? 0,
        l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : '',
        l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '',
      ])

      const csv = [headers, ...rows]
        .map(row => row.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${leads.length} leads`)
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${data?.total ?? 0} ${t('allLeads').toLowerCase()}`}>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 me-2" />
          {exporting ? 'Exporting...' : (t('export') || 'Export')}
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
