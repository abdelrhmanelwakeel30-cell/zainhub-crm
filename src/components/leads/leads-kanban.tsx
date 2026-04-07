'use client'

import { useTranslations } from 'next-intl'
import { leads, leadStages } from '@/lib/demo-data'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getInitials } from '@/lib/utils'
import Link from 'next/link'

export function LeadsKanban() {
  const t = useTranslations('leads')

  // Only show active stages (not Won/Lost)
  const activeStages = leadStages.filter(s => !['Won', 'Lost'].includes(s.name))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {activeStages.map((stage) => {
        const stageLeads = leads.filter(l => l.stageId === stage.id)

        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
              <h3 className="text-sm font-semibold">{stage.name}</h3>
              <Badge variant="secondary" className="text-xs h-5 min-w-5">
                {stageLeads.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {stageLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`}>
                  <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-s-4" style={{ borderInlineStartColor: stage.color }}>
                    <div className="space-y-2">
                      {/* Name + Score */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{lead.fullName}</p>
                          {lead.companyName && (
                            <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                          )}
                        </div>
                        <ScoreIndicator score={lead.score} size="sm" showLabel={false} />
                      </div>

                      {/* Service */}
                      <p className="text-xs text-muted-foreground">{lead.interestedService}</p>

                      {/* Meta */}
                      <div className="flex items-center justify-between">
                        <StatusBadge status={lead.urgency} />
                        {lead.assignedTo ? (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                              {getInitials(lead.assignedTo.name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>

                      {/* Budget */}
                      {lead.budgetRange && (
                        <p className="text-xs font-medium text-green-600">{lead.budgetRange}</p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
              {stageLeads.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-xs text-muted-foreground">No leads</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
