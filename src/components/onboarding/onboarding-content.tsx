'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, CheckCircle2, ClipboardList, Building2 } from 'lucide-react'
import { OnboardingDetail } from './onboarding-detail'
import { OnboardingFormDialog } from './onboarding-form-dialog'
import { cn, formatDate } from '@/lib/utils'

interface OnboardingItem {
  id: string
  completedAt: string | null
  isRequired: boolean
}

interface Onboarding {
  id: string
  status: string
  createdAt: string
  completedAt: string | null
  company: { id: string; displayName: string }
  project: { id: string; name: string } | null
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

function calcProgress(items: OnboardingItem[]) {
  if (!items.length) return 0
  const done = items.filter(i => !!i.completedAt).length
  return Math.round((done / items.length) * 100)
}

type TabFilter = 'active' | 'completed' | 'all'

export function OnboardingContent() {
  const [tab, setTab] = useState<TabFilter>('active')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const statusFilter = tab === 'active' ? 'IN_PROGRESS' : tab === 'completed' ? 'COMPLETED' : ''

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['onboardings', tab],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '100' })
      if (statusFilter) params.set('status', statusFilter)
      return fetch(`/api/onboarding?${params}`).then(r => r.json())
    },
  })

  const onboardings: Onboarding[] = data?.data ?? []
  const total = data?.total ?? 0

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Client Onboarding" description={`${total} onboarding${total !== 1 ? 's' : ''}`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" />
          New Onboarding
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-500 py-8 text-center">Failed to load onboardings.</p>
      ) : onboardings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No onboardings found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a new onboarding to track client setup progress.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 me-2" />
            New Onboarding
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {onboardings.map(ob => {
            const progress = calcProgress(ob.items)
            const doneCount = ob.items.filter(i => !!i.completedAt).length

            return (
              <Card
                key={ob.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedId(ob.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-sm truncate">{ob.company.displayName}</span>
                    </div>
                    <Badge variant="outline" className={cn('text-xs shrink-0', getStatusBadgeClass(ob.status))}>
                      {getStatusLabel(ob.status)}
                    </Badge>
                  </div>

                  {ob.project && (
                    <p className="text-xs text-muted-foreground truncate">
                      Project: {ob.project.name}
                    </p>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{doneCount} / {ob.items.length} items</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Started {formatDate(ob.createdAt)}</span>
                    {ob.status === 'COMPLETED' && ob.completedAt && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedId && (
        <OnboardingDetail
          id={selectedId}
          onClose={() => {
            setSelectedId(null)
            refetch()
          }}
        />
      )}

      <OnboardingFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={() => {
          refetch()
          setShowCreate(false)
        }}
      />
    </div>
  )
}
