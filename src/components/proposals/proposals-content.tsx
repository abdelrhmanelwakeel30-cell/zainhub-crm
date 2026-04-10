'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { ProposalsTable } from './proposals-table'
import { Button } from '@/components/ui/button'
import { Plus, Download, FileText, CheckCircle, Send } from 'lucide-react'

export function ProposalsContent() {
  const { data: proposalsResponse } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => fetch('/api/proposals').then(r => r.json()),
  })
  const proposals = proposalsResponse?.data ?? []

  const totalValue = proposals.reduce((s: number, p: { totalAmount: number }) => s + p.totalAmount, 0)
  const accepted = proposals.filter((p: { status: string }) => p.status === 'ACCEPTED')
  const sent = proposals.filter((p: { status: string }) => p.status === 'SENT')

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Proposals" description={`${proposals.length} proposals`}>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> Export</Button>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> New Proposal</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Proposals" value={proposals.length} icon={<FileText className="h-5 w-5" />} />
        <KPICard title="Total Value" value={`${(totalValue / 1000).toFixed(0)}K`} prefix="AED " icon={<FileText className="h-5 w-5" />} />
        <KPICard title="Accepted" value={accepted.length} icon={<CheckCircle className="h-5 w-5" />} />
        <KPICard title="Sent" value={sent.length} icon={<Send className="h-5 w-5" />} />
      </div>

      <ProposalsTable />
    </div>
  )
}
