'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  SkipForward,
  User,
} from 'lucide-react'

interface ApprovalStep {
  id: string
  stepNumber: number
  approverType: string
  approverId: string | null
  approver: { id: string; firstName: string; lastName: string } | null
  approverRole: { id: string; name: string } | null
  approverClientUser: { id: string; email: string } | null
  status: string
  comments: string | null
  decidedAt: string | null
}

interface ApprovalRequest {
  id: string
  entityType: string
  entityId: string
  entityTitle: string | null
  status: string
  currentStep: number
  totalSteps: number
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  requestedBy: { id: string; firstName: string; lastName: string } | null
  workflow: { id: string; name: string; entityType: string } | null
  steps: ApprovalStep[]
}

const stepStatusIcon = {
  PENDING: <Clock className="h-5 w-5 text-gray-400" />,
  APPROVED: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  REJECTED: <XCircle className="h-5 w-5 text-red-600" />,
  SKIPPED: <SkipForward className="h-5 w-5 text-yellow-500" />,
}

const stepStatusColor: Record<string, string> = {
  PENDING: 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
  APPROVED: 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700',
  REJECTED: 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700',
  SKIPPED: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700',
}

interface DecideDialogProps {
  step: ApprovalStep
  requestId: string
  onClose: () => void
}

function DecideDialog({ step, requestId, onClose }: DecideDialogProps) {
  const queryClient = useQueryClient()
  const [comments, setComments] = useState('')
  const [pendingDecision, setPendingDecision] = useState<'APPROVED' | 'REJECTED' | 'SKIPPED' | null>(null)

  const mutation = useMutation({
    mutationFn: (decision: 'APPROVED' | 'REJECTED' | 'SKIPPED') =>
      fetch(`/api/approvals/${requestId}/steps/${step.id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments: comments || undefined }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval', requestId] })
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      onClose()
    },
  })

  const handleDecide = (decision: 'APPROVED' | 'REJECTED' | 'SKIPPED') => {
    setPendingDecision(decision)
    mutation.mutate(decision)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make Decision — Step {step.stepNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Approver:{' '}
              <span className="font-medium text-foreground">
                {step.approver
                  ? `${step.approver.firstName} ${step.approver.lastName}`
                  : step.approverRole?.name || step.approverClientUser?.email || step.approverType}
              </span>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comments">Comments (optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add a comment or reason..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDecide('REJECTED')}
              disabled={mutation.isPending}
            >
              <XCircle className="h-4 w-4 me-1" />
              {pendingDecision === 'REJECTED' && mutation.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecide('SKIPPED')}
              disabled={mutation.isPending}
            >
              <SkipForward className="h-4 w-4 me-1" />
              {pendingDecision === 'SKIPPED' && mutation.isPending ? 'Skipping…' : 'Skip'}
            </Button>
          </div>
          <Button
            size="sm"
            onClick={() => handleDecide('APPROVED')}
            disabled={mutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="h-4 w-4 me-1" />
            {pendingDecision === 'APPROVED' && mutation.isPending ? 'Approving…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ApprovalDetail({ id }: { id: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const currentUserId = (session?.user as { id?: string })?.id

  const [decideStep, setDecideStep] = useState<ApprovalStep | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['approval', id],
    queryFn: () => fetch(`/api/approvals/${id}`).then((r) => r.json()),
  })

  const request: ApprovalRequest | undefined = data?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Approval request not found.
      </div>
    )
  }

  const isTerminal =
    request.status === 'APPROVED' ||
    request.status === 'REJECTED' ||
    request.status === 'WITHDRAWN'

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader
        title={request.entityTitle || `Approval #${id.slice(-6)}`}
        description={`${request.entityType.replace(/_/g, ' ')} — ${request.status}`}
      >
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
          Back
        </Button>
      </PageHeader>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={request.status.replace(/_/g, ' ').toLowerCase()} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-sm font-semibold">
              Step {request.currentStep} of {request.totalSteps}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Requested By</p>
            <p className="text-sm font-semibold">
              {request.requestedBy
                ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}`
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-semibold">
              {request.dueDate ? formatDate(request.dueDate) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow info */}
      {request.workflow && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Badge variant="outline" className="text-xs">Workflow</Badge>
            <span className="text-sm font-medium">{request.workflow.name}</span>
          </CardContent>
        </Card>
      )}

      {/* Steps timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-0">
            {request.steps.map((step, idx) => {
              const isLast = idx === request.steps.length - 1
              const isCurrentUserApprover = step.approverId === currentUserId
              const canDecide =
                !isTerminal &&
                step.status === 'PENDING' &&
                step.stepNumber === request.currentStep &&
                isCurrentUserApprover

              const approverLabel = step.approver
                ? `${step.approver.firstName} ${step.approver.lastName}`
                : step.approverRole?.name || step.approverClientUser?.email || step.approverType

              return (
                <li key={step.id} className="flex gap-4">
                  {/* Line + icon column */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${stepStatusColor[step.status]}`}
                    >
                      {stepStatusIcon[step.status as keyof typeof stepStatusIcon] || (
                        <span className="text-xs font-bold">{step.stepNumber}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div className="mt-1 w-0.5 flex-1 bg-border min-h-[2rem]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">
                          Step {step.stepNumber}
                          {step.stepNumber === request.currentStep && !isTerminal && (
                            <Badge
                              variant="outline"
                              className="ms-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Current
                            </Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{approverLabel}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={step.status.toLowerCase()}
                          className="text-xs"
                        />
                        {canDecide && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDecideStep(step)}
                          >
                            Make Decision
                          </Button>
                        )}
                      </div>
                    </div>
                    {step.decidedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Decided: {formatDate(step.decidedAt)}
                      </p>
                    )}
                    {step.comments && (
                      <div className="mt-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        {step.comments}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      {/* Completed at */}
      {request.completedAt && (
        <p className="text-xs text-center text-muted-foreground">
          Completed on {formatDate(request.completedAt)}
        </p>
      )}

      {/* Decide dialog */}
      {decideStep && (
        <DecideDialog
          step={decideStep}
          requestId={id}
          onClose={() => setDecideStep(null)}
        />
      )}
    </div>
  )
}
