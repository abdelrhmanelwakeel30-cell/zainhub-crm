'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { InvoicesTable } from './invoices-table'
import { InvoiceFormDialog } from './invoice-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export function InvoicesContent() {
  const t = useTranslations('invoices')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetch('/api/invoices').then(r => r.json()),
  })

  const invoices: Array<{ totalAmount: number; amountPaid: number; balanceDue: number; status: string }> = data?.data ?? []

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount ?? 0), 0)
  const paidAmount = invoices.reduce((sum, inv) => sum + (inv.amountPaid ?? 0), 0)
  const outstanding = invoices.reduce((sum, inv) => sum + (inv.balanceDue ?? 0), 0)
  const overdueAmount = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + (inv.balanceDue ?? 0), 0)

  const totalCount = data?.total ?? 0

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${totalCount} invoices`}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 me-2" /> Export
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> {t('newInvoice')}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalInvoiced')}
          value={`${(totalInvoiced / 1000).toFixed(0)}K`}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title={t('paidAmount')}
          value={`${(paidAmount / 1000).toFixed(0)}K`}
          prefix="AED "
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KPICard
          title={t('outstanding')}
          value={`${(outstanding / 1000).toFixed(0)}K`}
          prefix="AED "
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title={t('overdue')}
          value={`${(overdueAmount / 1000).toFixed(0)}K`}
          prefix="AED "
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <InvoicesTable />

      <InvoiceFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
