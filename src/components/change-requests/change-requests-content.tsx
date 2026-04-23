'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { ChangeRequestsTable } from './change-requests-table'
import { ChangeRequestFormDialog } from './change-request-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Download, GitMerge, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ChangeRequest {
  id: string
  crNumber: string
  status: string
  completedAt?: string | null
}

export function ChangeRequestsContent() {
  const [showCreate, setShowCreate] = useState(false)
  const [exporting, setExporting] = useState(false)
  const queryClient = useQueryClient()

  const { data: crResponse } = useQuery({
    queryKey: ['change-requests'],
    queryFn: () => fetch('/api/change-requests?pageSize=100').then(r => r.json()),
  })
  const changeRequests: ChangeRequest[] = crResponse?.data ?? []

  const openStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS']
  const totalOpen = changeRequests.filter((cr) => openStatuses.includes(cr.status)).length
  const pendingApproval = changeRequests.filter((cr) => cr.status === 'PENDING_APPROVAL').length
  const inProgress = changeRequests.filter((cr) => cr.status === 'IN_PROGRESS').length

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const completedThisMonth = changeRequests.filter((cr) => {
    if (cr.status !== 'COMPLETED') return false
    if (!cr.completedAt) return false
    return new Date(cr.completedAt) >= startOfMonth
  }).length

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['change-requests'] })
    setShowCreate(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/change-requests?pageSize=1000')
      if (!res.ok) throw new Error('Export failed')
      const json = await res.json()
      const rows: any[] = json.data ?? []
      if (rows.length === 0) { toast.info('No change requests to export'); return }
      const headers = ['CR #', 'Title', 'Status', 'Priority', 'Project', 'Requested By', 'Approved By', 'Completed At', 'Created At']
      const csvRows = rows.map((cr: any) => [
        cr.crNumber ?? '',
        cr.title ?? '',
        cr.status ?? '',
        cr.priority ?? '',
        cr.project?.name ?? '',
        cr.requestedBy ? `${cr.requestedBy.firstName} ${cr.requestedBy.lastName}` : '',
        cr.approvedBy ? `${cr.approvedBy.firstName} ${cr.approvedBy.lastName}` : '',
        cr.completedAt ? new Date(cr.completedAt).toLocaleDateString() : '',
        cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : '',
      ])
      const csv = [headers, ...csvRows]
        .map(row => row.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `change-requests-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${rows.length} change requests`)
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Change Requests" description={`${changeRequests.length} total change requests`}>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4 me-2" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" />
          New Change Request
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Open"
          value={totalOpen}
          icon={<GitMerge className="h-5 w-5" />}
        />
        <KPICard
          title="Pending Approval"
          value={pendingApproval}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <KPICard
          title="In Progress"
          value={inProgress}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title="Completed This Month"
          value={completedThisMonth}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <ChangeRequestsTable />

      <ChangeRequestFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={handleCreated}
      />
    </div>
  )
}
