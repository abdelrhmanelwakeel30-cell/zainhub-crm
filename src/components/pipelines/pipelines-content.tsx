'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Plus, ArrowRight } from 'lucide-react'

interface Stage {
  id: string
  name: string
  color: string
  order: number
  probability: number
  isClosed: boolean
  isWon: boolean
}

interface Pipeline {
  id: string
  name: string
  type: string
  isDefault: boolean
  isActive: boolean
  stages: Stage[]
}

export function PipelinesContent() {
  const { data: pipelinesData, isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => fetch('/api/pipelines').then(r => r.json()),
    staleTime: 300_000,
  })

  const { data: oppsData, isLoading: oppsLoading } = useQuery({
    queryKey: ['opportunities', 'pipeline-overview'],
    queryFn: () => fetch('/api/opportunities?pageSize=200').then(r => r.json()),
    staleTime: 60_000,
  })

  const pipelines: Pipeline[] = pipelinesData?.data ?? []
  const opportunities: Array<{ stageId: string; expectedValue: number; weightedValue: number }> = oppsData?.data ?? []
  const isLoading = pipelinesLoading || oppsLoading

  const stageCount = (stageId: string) => opportunities.filter(o => (o as Record<string, unknown>).stage && ((o as Record<string, unknown>).stage as { id: string }).id === stageId).length
  const stageValue = (stageId: string) => opportunities
    .filter(o => (o as Record<string, unknown>).stage && ((o as Record<string, unknown>).stage as { id: string }).id === stageId)
    .reduce((sum, o) => sum + Number(o.expectedValue ?? 0), 0)

  const totalDeals = opportunities.length
  const totalPipelineValue = opportunities.reduce((s, o) => s + Number(o.expectedValue ?? 0), 0)
  const totalWeightedValue = opportunities.reduce((s, o) => s + Number(o.weightedValue ?? 0), 0)

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Pipelines" description="Sales pipeline configuration & overview">
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> New Pipeline</Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      ) : (
        <>
          {pipelines.map(pipeline => {
            const activeStages = pipeline.stages.filter(s => !s.isClosed)
            const closedStages = pipeline.stages.filter(s => s.isClosed)
            return (
              <Card key={pipeline.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{pipeline.name}</CardTitle>
                    <StatusBadge status={pipeline.isActive ? 'active' : 'inactive'} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {[...activeStages, ...closedStages].map((stage, i, arr) => {
                      const count = stageCount(stage.id)
                      const value = stageValue(stage.id)
                      return (
                        <div key={stage.id} className="flex items-center gap-2">
                          <div className="min-w-[160px] rounded-lg border p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color || '#6b7280' }} />
                              <p className="text-xs font-medium">{stage.name}</p>
                            </div>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">
                              AED {value.toLocaleString()}
                            </p>
                          </div>
                          {i < arr.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Pipeline Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold mt-1">{totalDeals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">
                  AED {totalPipelineValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold mt-1">
                  AED {totalWeightedValue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
