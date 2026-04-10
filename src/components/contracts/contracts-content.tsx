'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { ContractsTable } from './contracts-table'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

export function ContractsContent() {
  const { data: contractsResponse } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => fetch('/api/contracts').then(r => r.json()),
  })
  const contracts = contractsResponse?.data ?? []

  const totalValue = contracts
    .filter((c: { totalValue?: number }) => c.totalValue)
    .reduce((s: number, c: { totalValue: number }) => s + c.totalValue, 0)
  const active = contracts.filter((c: { status: string }) => c.status === 'ACTIVE')
  const expiringSoon = contracts.filter(
    (c: { endDate?: string }) =>
      c.endDate && new Date(c.endDate) < new Date(Date.now() + 90 * 86400000)
  )

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Contracts" description={`${contracts.length} contracts`}>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> Export</Button>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> New Contract</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Contracts" value={contracts.length} icon={<FileText className="h-5 w-5" />} />
        <KPICard title="Total Value" value={`${(totalValue / 1000).toFixed(0)}K`} prefix="AED " icon={<FileText className="h-5 w-5" />} />
        <KPICard title="Active" value={active.length} icon={<CheckCircle className="h-5 w-5" />} />
        <KPICard title="Renewal Soon" value={expiringSoon.length} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <ContractsTable />
    </div>
  )
}
