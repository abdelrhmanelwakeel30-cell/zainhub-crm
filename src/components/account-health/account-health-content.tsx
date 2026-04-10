'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity, AlertTriangle, TrendingUp, Users, RefreshCw,
  BarChart3, Ticket, FileText, ChevronRight
} from 'lucide-react'
import { HealthUpdateDialog } from './health-update-dialog'
import { cn, formatDate } from '@/lib/utils'

interface AccountHealth {
  id: string
  companyId: string
  healthScore: number
  riskLevel: string
  upsellReadiness: string
  overdueInvoicesCount: number
  openTicketsCount: number
  notes: string | null
  lastCalculatedAt: string
  company: { id: string; displayName: string }
}

function getScoreColor(score: number) {
  if (score > 70) return 'bg-green-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreTextColor(score: number) {
  if (score > 70) return 'text-green-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function getRiskBadgeClass(riskLevel: string) {
  switch (riskLevel) {
    case 'LOW': return 'bg-green-50 text-green-700 border-green-200'
    case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'HIGH': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

function getUpsellBadgeClass(upsell: string) {
  switch (upsell) {
    case 'HIGH': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'LOW': return 'bg-gray-50 text-gray-500 border-gray-200'
    default: return 'bg-gray-50 text-gray-500 border-gray-200'
  }
}

export function AccountHealthContent() {
  const [selectedHealth, setSelectedHealth] = useState<AccountHealth | null>(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const [recalcCompanyId, setRecalcCompanyId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['account-health'],
    queryFn: () => fetch('/api/account-health').then(r => r.json()),
  })

  const records: AccountHealth[] = data?.data ?? []

  const healthy = records.filter(r => r.riskLevel === 'LOW').length
  const atRisk = records.filter(r => r.riskLevel === 'MEDIUM').length
  const critical = records.filter(r => r.riskLevel === 'HIGH').length
  const avgScore = records.length
    ? Math.round(records.reduce((sum, r) => sum + r.healthScore, 0) / records.length)
    : 0

  const kpis = [
    { label: 'Healthy Clients', value: healthy, icon: Activity, color: 'text-green-600' },
    { label: 'At Risk', value: atRisk, icon: AlertTriangle, color: 'text-amber-600' },
    { label: 'Critical', value: critical, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Avg Score', value: `${avgScore}`, icon: BarChart3, color: 'text-blue-600' },
  ]

  const handleRecalc = async (companyId: string) => {
    setRecalcCompanyId(companyId)
    try {
      await fetch('/api/account-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      refetch()
    } finally {
      setRecalcCompanyId(null)
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Account Health" description={`${records.length} accounts tracked`}>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 me-2" />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setSelectedHealth(null)
            setShowUpdate(true)
          }}
        >
          <TrendingUp className="h-4 w-4 me-2" />
          Recalculate Health
        </Button>
      </PageHeader>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={cn('h-8 w-8 opacity-80', kpi.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-500 py-8 text-center">Failed to load account health records.</p>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No health records yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click Recalculate Health to generate scores for your clients.
          </p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Risk Level</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Open Tickets</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Overdue Invoices</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Upsell Readiness</th>
                  <th className="text-start px-4 py-3 font-medium text-muted-foreground">Last Calculated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedHealth(record)
                      setShowUpdate(true)
                    }}
                  >
                    <td className="px-4 py-3 font-medium">{record.company?.displayName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress
                          value={record.healthScore}
                          className={cn('h-2 flex-1', '[&>div]:' + getScoreColor(record.healthScore))}
                        />
                        <span className={cn('text-xs font-semibold tabular-nums w-8', getScoreTextColor(record.healthScore))}>
                          {record.healthScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', getRiskBadgeClass(record.riskLevel))}>
                        {record.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1', record.openTicketsCount > 0 ? 'text-amber-600' : 'text-muted-foreground')}>
                        <Ticket className="h-3.5 w-3.5" />
                        {record.openTicketsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1', record.overdueInvoicesCount > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                        <FileText className="h-3.5 w-3.5" />
                        {record.overdueInvoicesCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', getUpsellBadgeClass(record.upsellReadiness))}>
                        {record.upsellReadiness}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {record.lastCalculatedAt ? formatDate(record.lastCalculatedAt) : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        disabled={recalcCompanyId === record.companyId}
                        onClick={() => handleRecalc(record.companyId)}
                      >
                        <RefreshCw className={cn('h-3 w-3 me-1', recalcCompanyId === record.companyId && 'animate-spin')} />
                        Recalc
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline ms-1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <HealthUpdateDialog
        open={showUpdate}
        onOpenChange={setShowUpdate}
        health={selectedHealth}
        onSuccess={() => {
          refetch()
          setShowUpdate(false)
        }}
      />
    </div>
  )
}
