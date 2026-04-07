'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { ProjectsTable } from './projects-table'
import { ProjectFormDialog } from './project-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Download, FolderKanban, Play, CheckCircle2, DollarSign } from 'lucide-react'
import { projects } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

export function ProjectsContent() {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const totalProjects = projects.length
  const inProgress = projects.filter(p => p.status === 'IN_PROGRESS').length
  const completed = projects.filter(p => p.status === 'COMPLETED').length
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)

  const kpis = [
    { label: t('totalProjects'), value: totalProjects, icon: FolderKanban, color: 'text-blue-600' },
    { label: t('inProgress'), value: inProgress, icon: Play, color: 'text-amber-600' },
    { label: t('completed'), value: completed, icon: CheckCircle2, color: 'text-green-600' },
    { label: t('totalBudget'), value: formatCurrency(totalBudget), icon: DollarSign, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${totalProjects} projects`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" />
          {tc('export') || 'Export'}
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('newProject')}
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProjectsTable />

      <ProjectFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
