'use client'

import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { Plus, ArrowRight } from 'lucide-react'
import { opportunities } from '@/lib/demo-data'

const defaultStages = [
  { name: 'Discovery', key: 'DISCOVERY', color: 'bg-indigo-500' },
  { name: 'Proposal', key: 'PROPOSAL', color: 'bg-violet-500' },
  { name: 'Negotiation', key: 'NEGOTIATION', color: 'bg-blue-500' },
  { name: 'Contract', key: 'CONTRACT', color: 'bg-cyan-500' },
  { name: 'Closed Won', key: 'CLOSED_WON', color: 'bg-green-500' },
  { name: 'Closed Lost', key: 'CLOSED_LOST', color: 'bg-red-500' },
]

export function PipelinesContent() {
  const stageCount = (key: string) => opportunities.filter(o => o.stage === key).length
  const stageValue = (key: string) => opportunities.filter(o => o.stage === key).reduce((sum, o) => sum + o.value, 0)

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Pipelines" description="Sales pipeline configuration & overview">
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> New Pipeline</Button>
      </PageHeader>

      {/* Default Sales Pipeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Default Sales Pipeline</CardTitle>
            <StatusBadge status="active" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {defaultStages.map((stage, i) => {
              const count = stageCount(stage.key)
              const value = stageValue(stage.key)
              return (
                <div key={stage.key} className="flex items-center gap-2">
                  <div className="min-w-[160px] rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                      <p className="text-xs font-medium">{stage.name}</p>
                    </div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      AED {value.toLocaleString()}
                    </p>
                  </div>
                  {i < defaultStages.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Deals</p>
            <p className="text-2xl font-bold mt-1">{opportunities.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold mt-1">
              AED {opportunities.reduce((s, o) => s + o.value, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Weighted Value</p>
            <p className="text-2xl font-bold mt-1">
              AED {opportunities.reduce((s, o) => s + o.weightedValue, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
