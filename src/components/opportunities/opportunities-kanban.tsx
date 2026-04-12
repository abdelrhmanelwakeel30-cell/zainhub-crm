'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Building2, User, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Stage {
  id: string
  name: string
  color: string | null
  probability: number | null
  isClosed: boolean
  isWon: boolean
}

interface Opportunity {
  id: string
  title: string
  expectedValue: number
  currency: string
  probability: number
  stageId: string | null
  company?: { id: string; displayName: string } | null
  owner?: { id: string; firstName: string; lastName: string } | null
  stage?: { id: string; name: string; color: string | null } | null
}

function KanbanCard({ opportunity, isDragging }: { opportunity: Opportunity; isDragging?: boolean }) {
  return (
    <Card className={`p-3 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-blue-500' : 'hover:shadow-md'} transition-shadow`}>
      <Link href={`/opportunities/${opportunity.id}`} className="block">
        <p className="text-sm font-medium truncate">{opportunity.title}</p>
        {opportunity.company && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{opportunity.company.displayName}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
            <DollarSign className="h-3 w-3" />
            {opportunity.currency} {opportunity.expectedValue.toLocaleString()}
          </div>
          {opportunity.owner && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{opportunity.owner.firstName}</span>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}

function SortableCard({ opportunity }: { opportunity: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
    data: { type: 'opportunity', opportunity },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard opportunity={opportunity} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumn({ stage, opportunities, totalValue, currency }: {
  stage: Stage
  opportunities: Opportunity[]
  totalValue: number
  currency: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { type: 'stage' } })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[320px] rounded-lg border bg-muted/30 ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
    >
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: stage.color || '#6b7280' }}
            />
            <h3 className="text-sm font-semibold">{stage.name}</h3>
          </div>
          <span className="text-xs font-medium bg-background border rounded-full px-2 py-0.5">
            {opportunities.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {currency} {totalValue.toLocaleString()}
          {stage.probability != null && ` · ${stage.probability}%`}
        </p>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        <SortableContext items={opportunities.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {opportunities.map((opp) => (
            <SortableCard key={opp.id} opportunity={opp} />
          ))}
        </SortableContext>
        {opportunities.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            Drop opportunities here
          </div>
        )}
      </div>
    </div>
  )
}

export function OpportunitiesKanban() {
  const queryClient = useQueryClient()
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  // Fetch pipeline stages
  const { data: pipelineData } = useQuery({
    queryKey: ['pipelines', 'OPPORTUNITY'],
    queryFn: () => fetch('/api/pipelines?entityType=OPPORTUNITY').then(r => r.json()),
  })

  // Fetch all opportunities (non-paginated for kanban)
  const { data: oppData } = useQuery({
    queryKey: ['opportunities', 'kanban'],
    queryFn: () => fetch('/api/opportunities?pageSize=100').then(r => r.json()),
  })

  const stages: Stage[] = pipelineData?.data?.[0]?.stages ?? []
  const opportunities: Opportunity[] = oppData?.data ?? []

  const opportunitiesByStage = useMemo(() => {
    const map: Record<string, Opportunity[]> = {}
    for (const stage of stages) {
      map[stage.id] = opportunities.filter(o => o.stageId === stage.id)
    }
    return map
  }, [stages, opportunities])

  const updateStageMutation = useMutation({
    mutationFn: ({ oppId, stageId }: { oppId: string; stageId: string }) =>
      fetch(`/api/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId }),
      }).then(r => r.json()),
    onMutate: async ({ oppId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities', 'kanban'] })
      const previous = queryClient.getQueryData(['opportunities', 'kanban'])

      queryClient.setQueryData(['opportunities', 'kanban'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: old.data.map((o: Opportunity) =>
            o.id === oppId ? { ...o, stageId, stage: stages.find(s => s.id === stageId) } : o,
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['opportunities', 'kanban'], context.previous)
      }
      toast.error('Failed to update stage')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })

  const handleDragStart = (event: DragStartEvent) => {
    const opp = event.active.data.current?.opportunity as Opportunity | undefined
    if (opp) setActiveOpp(opp)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOpp(null)
    const { active, over } = event
    if (!over) return

    const oppId = active.id as string
    const opp = opportunities.find(o => o.id === oppId)
    if (!opp) return

    // Find target stage — could be dropping on the column or on another card
    let targetStageId: string | null = null

    if (over.data.current?.type === 'stage') {
      targetStageId = over.id as string
    } else if (over.data.current?.type === 'opportunity') {
      const targetOpp = over.data.current.opportunity as Opportunity
      targetStageId = targetOpp.stageId
    }

    if (targetStageId && targetStageId !== opp.stageId) {
      const targetStage = stages.find(s => s.id === targetStageId)
      updateStageMutation.mutate({ oppId, stageId: targetStageId })
      if (targetStage) {
        toast.success(`Moved to ${targetStage.name}`)
      }
    }
  }

  const defaultCurrency = opportunities[0]?.currency ?? 'AED'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageOpps = opportunitiesByStage[stage.id] ?? []
          const totalValue = stageOpps.reduce((sum, o) => sum + (o.expectedValue ?? 0), 0)
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              opportunities={stageOpps}
              totalValue={totalValue}
              currency={defaultCurrency}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeOpp ? <KanbanCard opportunity={activeOpp} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
