'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'

interface OnboardingItem {
  id: string
  title: string
  description: string | null
  isRequired: boolean
  order: number
  completedAt: string | null
  completedBy: { id: string; firstName: string; lastName: string } | null
  notes: string | null
}

interface OnboardingDetail {
  id: string
  status: string
  createdAt: string
  completedAt: string | null
  company: { id: string; displayName: string }
  project: { id: string; name: string } | null
  template: { id: string; name: string } | null
  items: OnboardingItem[]
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200'
    case 'CANCELLED': return 'bg-gray-50 text-gray-500 border-gray-200'
    default: return 'bg-gray-50 text-gray-500 border-gray-200'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'IN_PROGRESS': return 'In Progress'
    case 'COMPLETED': return 'Completed'
    case 'CANCELLED': return 'Cancelled'
    default: return status
  }
}

interface Props {
  id: string
  onClose: () => void
}

export function OnboardingDetail({ id, onClose }: Props) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding', id],
    queryFn: () => fetch(`/api/onboarding/${id}`).then(r => r.json()),
  })

  const onboarding: OnboardingDetail | null = data?.data ?? null

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      fetch(`/api/onboarding/${id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to update item')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] })
      queryClient.invalidateQueries({ queryKey: ['onboardings'] })
      toast.success('Item updated')
    },
    onError: () => toast.error('Failed to update item'),
  })

  const items = onboarding?.items ?? []
  const doneCount = items.filter(i => !!i.completedAt).length
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !onboarding ? (
          <p className="text-sm text-muted-foreground mt-6">Onboarding not found.</p>
        ) : (
          <>
            <SheetHeader className="mb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="text-lg">{onboarding.company.displayName}</SheetTitle>
                  {onboarding.project && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Project: {onboarding.project.name}
                    </p>
                  )}
                  {onboarding.template && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Template: {onboarding.template.name}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className={cn('text-xs shrink-0', getStatusBadgeClass(onboarding.status))}>
                  {getStatusLabel(onboarding.status)}
                </Badge>
              </div>
            </SheetHeader>

            {/* Progress */}
            <div className="space-y-1 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{doneCount} / {items.length} items ({progress}%)</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                <p className="font-medium">{formatDate(onboarding.createdAt)}</p>
              </div>
              {onboarding.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Completed</p>
                  <p className="font-medium flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {formatDate(onboarding.completedAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Checklist
              </p>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items in this onboarding.</p>
              ) : (
                items.map((item) => {
                  const isDone = !!item.completedAt
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                        isDone ? 'bg-green-50/50 border-green-100' : 'bg-background border-border'
                      )}
                    >
                      <Checkbox
                        checked={isDone}
                        disabled={toggleMutation.isPending || onboarding.status === 'CANCELLED'}
                        onCheckedChange={(checked) => {
                          toggleMutation.mutate({ itemId: item.id, completed: !!checked })
                        }}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>
                            {item.title}
                          </span>
                          {item.isRequired && (
                            <span className="text-red-500 text-xs font-medium">*</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                        {isDone && item.completedBy && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Completed by {item.completedBy.firstName} {item.completedBy.lastName}
                            {item.completedAt ? ` · ${formatDate(item.completedAt)}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {items.some(i => i.isRequired) && (
              <p className="text-xs text-muted-foreground mt-3">
                <span className="text-red-500">*</span> Required items
              </p>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
