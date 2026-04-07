'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { ExpensesTable } from './expenses-table'
import { ExpenseFormDialog } from './expense-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, DollarSign, Clock, CheckCircle, BarChart3 } from 'lucide-react'
import { expenses } from '@/lib/demo-data'

export function ExpensesContent() {
  const t = useTranslations('expenses')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const totalExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0)
  const pendingExpenses = expenses.filter(e => e.status === 'PENDING')
  const pendingTotal = pendingExpenses.reduce((sum, e) => sum + e.totalAmount, 0)
  const approvedExpenses = expenses.filter(e => e.status === 'APPROVED')
  const approvedTotal = approvedExpenses.reduce((sum, e) => sum + e.totalAmount, 0)

  // Find top spending category
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category.name
    acc[cat] = (acc[cat] || 0) + e.totalAmount
    return acc
  }, {})
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${expenses.length} expenses`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" /> Export
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> {t('newExpense')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalExpenses')}
          value={`${(totalExpenses / 1000).toFixed(0)}K`}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title={t('pendingApproval')}
          value={pendingExpenses.length}
          suffix={` (AED ${pendingTotal.toLocaleString()})`}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title={t('approved')}
          value={approvedExpenses.length}
          suffix={` (AED ${approvedTotal.toLocaleString()})`}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KPICard
          title={t('topCategory')}
          value={topCategory ? topCategory[0] : '-'}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <ExpensesTable />

      <ExpenseFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
