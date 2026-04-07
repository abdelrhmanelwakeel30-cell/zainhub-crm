'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { QuotationsTable } from './quotations-table'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileText, CheckCircle, Clock, Send } from 'lucide-react'
import { quotations } from '@/lib/demo-data'

export function QuotationsContent() {
  const t = useTranslations('common')

  const totalValue = quotations.reduce((s, q) => s + q.totalAmount, 0)
  const accepted = quotations.filter(q => q.status === 'ACCEPTED')
  const pending = quotations.filter(q => ['SENT', 'DRAFT'].includes(q.status))

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Quotations" description={`${quotations.length} quotations`}>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> Export</Button>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> New Quotation</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Quotations" value={quotations.length} icon={<FileText className="h-5 w-5" />} />
        <KPICard title="Total Value" value={`${(totalValue / 1000).toFixed(0)}K`} prefix="AED " icon={<FileText className="h-5 w-5" />} />
        <KPICard title="Accepted" value={accepted.length} icon={<CheckCircle className="h-5 w-5" />} />
        <KPICard title="Pending" value={pending.length} icon={<Clock className="h-5 w-5" />} />
      </div>

      <QuotationsTable />
    </div>
  )
}
