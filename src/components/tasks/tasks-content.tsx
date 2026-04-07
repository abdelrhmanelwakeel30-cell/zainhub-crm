'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { TasksTable } from './tasks-table'
import { TaskFormDialog } from './task-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, ListTodo, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { tasks } from '@/lib/demo-data'

export function TasksContent() {
  const t = useTranslations('tasks')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const totalTasks = tasks.length
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const overdue = tasks.filter(t => {
    const due = new Date(t.dueDate)
    return due < new Date() && t.status !== 'COMPLETED'
  }).length
  const completed = tasks.filter(t => t.status === 'COMPLETED').length

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${totalTasks} ${t('allTasks').toLowerCase()}`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" />
          {t('export') || 'Export'}
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('newTask')}
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalTasks')}
          value={totalTasks}
          icon={<ListTodo className="h-5 w-5" />}
        />
        <KPICard
          title={t('inProgress')}
          value={inProgress}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title={t('overdueTasks')}
          value={overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <KPICard
          title={t('completedTasks')}
          value={completed}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <TasksTable />

      <TaskFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
