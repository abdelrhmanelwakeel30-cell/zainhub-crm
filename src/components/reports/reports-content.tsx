'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { leads, opportunities, invoices, projects, users, companies } from '@/lib/demo-data'
import {
  DollarSign, GitBranch, Users, Heart,
  TrendingUp, Target, Handshake, ArrowRight
} from 'lucide-react'

function computeRevenueReport() {
  const paidInvoices = invoices.filter(i => i.status === 'PAID')
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0)
  const pendingRevenue = invoices.filter(i => i.status === 'SENT' || i.status === 'PARTIALLY_PAID').reduce((sum, i) => sum + i.balanceDue, 0)
  const overdueRevenue = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + i.balanceDue, 0)

  const revenueByClient: Record<string, number> = {}
  paidInvoices.forEach(inv => {
    const name = inv.client.name
    revenueByClient[name] = (revenueByClient[name] || 0) + inv.totalAmount
  })
  const topClients = Object.entries(revenueByClient).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return { totalRevenue, pendingRevenue, overdueRevenue, topClients, paidCount: paidInvoices.length }
}

function computePipelineReport() {
  const stages = ['Discovery', 'Proposal', 'Negotiation', 'Contract', 'Closed Won', 'Closed Lost']
  const stageData = stages.map(stage => {
    const opps = opportunities.filter(o => o.stage === stage)
    return { stage, count: opps.length, value: opps.reduce((sum, o) => sum + o.value, 0) }
  })
  const activeOpps = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage))
  const totalPipeline = activeOpps.reduce((sum, o) => sum + o.value, 0)
  const weightedPipeline = activeOpps.reduce((sum, o) => sum + o.weightedValue, 0)
  const closedOpps = opportunities.filter(o => ['Closed Won', 'Closed Lost'].includes(o.stage))
  const wonOpps = opportunities.filter(o => o.stage === 'Closed Won')
  const winRate = closedOpps.length > 0 ? Math.round((wonOpps.length / closedOpps.length) * 100) : 0

  return { stageData, totalPipeline, weightedPipeline, winRate, activeCount: activeOpps.length }
}

function computeTeamReport() {
  return users.map(user => {
    const fullName = `${user.firstName} ${user.lastName}`
    const assignedLeads = leads.filter(l => l.assignedTo?.id === user.id).length
    const ownedOpps = opportunities.filter(o => o.owner?.id === user.id)
    const wonValue = ownedOpps.filter(o => o.stage === 'Closed Won').reduce((sum, o) => sum + o.value, 0)
    const activeOpps = ownedOpps.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length
    return { id: user.id, name: fullName, role: user.jobTitle, assignedLeads, activeOpps, wonValue }
  })
}

function computeRetentionReport() {
  const customerCompanies = companies.filter(c => c.lifecycleStage === 'Customer')
  const avgHealth = customerCompanies.length > 0
    ? Math.round(customerCompanies.reduce((sum, c) => sum + c.healthScore, 0) / customerCompanies.length)
    : 0
  const atRisk = customerCompanies.filter(c => c.healthScore < 50)
  const healthy = customerCompanies.filter(c => c.healthScore >= 70)

  return { totalCustomers: customerCompanies.length, avgHealth, atRisk, healthy }
}

export function ReportsContent() {
  const t = useTranslations('reports')
  const [activeTab, setActiveTab] = useState('revenue')

  const revenue = computeRevenueReport()
  const pipeline = computePipelineReport()
  const team = computeTeamReport()
  const retention = computeRetentionReport()

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description="Insights and analytics across your CRM" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" /> {t('revenue')}
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <GitBranch className="h-4 w-4" /> {t('pipeline')}
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" /> {t('teamPerformance')}
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Heart className="h-4 w-4" /> Client Retention
          </TabsTrigger>
        </TabsList>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Collected Revenue</p>
                <p className="text-2xl font-bold mt-1">AED {revenue.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{revenue.paidCount} paid invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending Revenue</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">AED {revenue.pendingRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Overdue Revenue</p>
                <p className="text-2xl font-bold mt-1 text-red-600">AED {revenue.overdueRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Needs follow-up</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue.topClients.length > 0 ? (
                <div className="space-y-3">
                  {revenue.topClients.map(([name, value], i) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      <span className="text-sm font-semibold">AED {value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No revenue data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Report */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold mt-1">{pipeline.activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">AED {pipeline.totalPipeline.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold mt-1">AED {pipeline.weightedPipeline.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold mt-1">{pipeline.winRate}%</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pipeline.stageData.map(({ stage, count, value }) => (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusBadge status={stage} />
                      <span className="text-sm text-muted-foreground">{count} deal{count !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-sm font-semibold shrink-0">AED {value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Report */}
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start py-2 font-medium text-muted-foreground">Team Member</th>
                      <th className="text-start py-2 font-medium text-muted-foreground">Role</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Assigned Leads</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Active Opps</th>
                      <th className="text-end py-2 font-medium text-muted-foreground">Won Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(member => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{member.name}</td>
                        <td className="py-3 text-muted-foreground">{member.role}</td>
                        <td className="py-3 text-center">{member.assignedLeads}</td>
                        <td className="py-3 text-center">{member.activeOpps}</td>
                        <td className="py-3 text-end font-semibold">
                          {member.wonValue > 0 ? `AED ${member.wonValue.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Retention Report */}
        <TabsContent value="retention" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold mt-1">{retention.totalCustomers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Health Score</p>
                <p className="text-2xl font-bold mt-1">{retention.avgHealth}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{retention.healthy.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{retention.atRisk.length}</p>
              </CardContent>
            </Card>
          </div>
          {retention.atRisk.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">At-Risk Clients (Health &lt; 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {retention.atRisk.map(company => (
                    <div key={company.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium">{company.displayName}</p>
                        <p className="text-xs text-muted-foreground">{company.industry}</p>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                        Score: {company.healthScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {retention.healthy.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Healthy Clients (Health &ge; 70)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {retention.healthy.map(company => (
                    <div key={company.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium">{company.displayName}</p>
                        <p className="text-xs text-muted-foreground">{company.industry}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                        Score: {company.healthScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
