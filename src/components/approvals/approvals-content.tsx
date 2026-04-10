'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { ApprovalsTable } from './approvals-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { CheckSquare, Clock, CheckCircle2, XCircle, List, GitBranch } from 'lucide-react'

interface ApprovalWorkflow {
  id: string
  name: string
  entityType: string
  isActive: boolean
  steps: Array<{ stepNumber: number; approverType: string; label?: string }>
}

interface ApprovalRequest {
  status: string
}

export function ApprovalsContent() {
  const { data: requestsData } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => fetch('/api/approvals').then((r) => r.json()),
  })

  const { data: workflowsData } = useQuery({
    queryKey: ['approval-workflows'],
    queryFn: () => fetch('/api/approvals/workflows').then((r) => r.json()),
  })

  const requests: ApprovalRequest[] = requestsData?.data ?? []
  const workflows: ApprovalWorkflow[] = workflowsData?.data ?? []

  const total = requestsData?.total ?? 0
  const pending = requests.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length
  const approved = requests.filter((r) => r.status === 'APPROVED').length
  const rejected = requests.filter((r) => r.status === 'REJECTED').length

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader
        title="Approvals"
        description={`${total} total approval request${total !== 1 ? 's' : ''}`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Requests"
          value={total}
          icon={<List className="h-5 w-5" />}
        />
        <KPICard
          title="Pending / In Progress"
          value={pending}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title="Approved"
          value={approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KPICard
          title="Rejected"
          value={rejected}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">
            <CheckSquare className="h-4 w-4 me-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <GitBranch className="h-4 w-4 me-2" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <ApprovalsTable />
        </TabsContent>

        <TabsContent value="workflows" className="mt-4">
          {workflows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No workflows configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <Card key={wf.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold">{wf.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          wf.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }
                      >
                        {wf.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <StatusBadge
                      status={wf.entityType.replace(/_/g, ' ').toLowerCase()}
                      className="w-fit text-xs"
                    />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      {Array.isArray(wf.steps) ? wf.steps.length : 0} step
                      {Array.isArray(wf.steps) && wf.steps.length !== 1 ? 's' : ''}
                    </p>
                    {Array.isArray(wf.steps) && wf.steps.length > 0 && (
                      <ol className="space-y-1">
                        {wf.steps.map((step) => (
                          <li key={step.stepNumber} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex-none w-5 h-5 rounded-full bg-muted flex items-center justify-center font-mono text-[10px] font-semibold">
                              {step.stepNumber}
                            </span>
                            <span>{step.label || step.approverType}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
