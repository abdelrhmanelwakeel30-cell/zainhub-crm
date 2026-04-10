'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { ClientServicesTable } from './client-services-table'
import { ClientServiceFormDialog } from './client-service-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Activity, RefreshCcw, CheckCircle2, TrendingUp } from 'lucide-react'

export function ClientServicesContent() {
  const [formOpen, setFormOpen] = useState(false)

  const { data: response } = useQuery({
    queryKey: ['client-services'],
    queryFn: () => fetch('/api/client-services?pageSize=200').then(r => r.json()),
  })

  const services: {
    status: string
    monthlyValue?: number
    endDate?: string
  }[] = response?.data ?? []

  const totalActive = services.filter(s => s.status === 'ACTIVE').length
  const pendingRenewal = services.filter(s => s.status === 'PENDING_RENEWAL').length

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = services.filter(
    s => s.status === 'COMPLETED' && s.endDate && new Date(s.endDate) >= startOfMonth
  ).length

  const totalMRR = services
    .filter(s => s.status === 'ACTIVE' && s.monthlyValue)
    .reduce((sum, s) => sum + (s.monthlyValue ?? 0), 0)

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader
        title="Client Services"
        description={`${services.length} service records`}
      >
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          New Service
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Active"
          value={totalActive}
          icon={<Activity className="h-5 w-5" />}
        />
        <KPICard
          title="Pending Renewal"
          value={pendingRenewal}
          icon={<RefreshCcw className="h-5 w-5" />}
        />
        <KPICard
          title="Completed This Month"
          value={completedThisMonth}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Total MRR"
          value={totalMRR > 0 ? `${(totalMRR / 1000).toFixed(1)}K` : '0'}
          prefix="AED "
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <ClientServicesTable />

      <ClientServiceFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
