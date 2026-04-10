'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign, GitBranch, Users, Heart,
} from 'lucide-react'

interface DashboardKpis {
  totalLeads: number
  newLeadsThisMonth: number
  totalCompanies: number
  totalContacts: number
  openOpportunities: number
  pipelineValue: number
  activeProjects: number
  overdueTasks: number
  openTickets: number
  monthlyRevenue: number
  revenueGrowth: string | null
  paidInvoicesThisMonth: number
  overdueInvoices: number
  unreadNotifications: number
}

interface DashboardCharts {
  pipeline: Array<{ id: string; name: string; count: number; color: string }>
  leadsBySource: Array<{ sourceId: string | null; _count: { id: number } }>
  revenueByMonth: Array<{ month: string; total: number }>
}

interface DashboardApiResponse {
  success: boolean
  data: {
    kpis: DashboardKpis
    charts: DashboardCharts
    recentActivities: unknown[]
  }
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  totalAmount: number
  balanceDue: number
  dueDate: string
  client: { displayName: string }
}

interface InvoicesApiResponse {
  success: boolean
  data: Invoice[]
  total: number
}

interface Opportunity {
  id: string
  name: string
  stage: string
  value: number
  weightedValue: number
  owner: { id: string; firstName: string; lastName: string } | null
}

interface OpportunitiesApiResponse {
  success: boolean
  data: Opportunity[]
  total: number
}

interface Lead {
  id: string
  assignedTo: { id: string } | null
}

interface LeadsApiResponse {
  success: boolean
  data: Lead[]
  total: number
}

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  jobTitle: string | null
}

interface UsersApiResponse {
  success: boolean
  data: TeamMember[]
  total: number
}

interface Company {
  id: string
  displayName: string
  industry: string | null
  lifecycleStage: string
  healthScore: number
}

interface CompaniesApiResponse {
  success: boolean
  data: Company[]
  total: number
}

export function ReportsContent() {
  const t = useTranslations('reports')
  const [activeTab, setActiveTab] = useState('revenue')

  const { data: dashboardResponse } = useQuery<DashboardApiResponse>({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/dashboard').then(r => r.json()),
  })

  const { data: invoicesResponse } = useQuery<InvoicesApiResponse>({
    queryKey: ['invoices-report'],
    queryFn: () => fetch('/api/invoices?pageSize=200').then(r => r.json()),
    enabled: activeTab === 'revenue',
  })

  const { data: oppsResponse } = useQuery<OpportunitiesApiResponse>({
    queryKey: ['opportunities-report'],
    queryFn: () => fetch('/api/opportunities?pageSize=200').then(r => r.json()),
    enabled: activeTab === 'pipeline',
  })

  const { data: leadsResponse } = useQuery<LeadsApiResponse>({
    queryKey: ['leads-report'],
    queryFn: () => fetch('/api/leads?pageSize=200').then(r => r.json()),
    enabled: activeTab === 'team',
  })

  const { data: usersResponse } = useQuery<UsersApiResponse>({
    queryKey: ['users-report'],
    queryFn: () => fetch('/api/users?pageSize=100').then(r => r.json()),
    enabled: activeTab === 'team',
  })

  const { data: companiesResponse } = useQuery<CompaniesApiResponse>({
    queryKey: ['companies-report'],
    queryFn: () => fetch('/api/companies?pageSize=200').then(r => r.json()),
    enabled: activeTab === 'retention',
  })

  // Revenue tab
  const invoices = invoicesResponse?.data ?? []
  const paidInvoices = invoices.filter(i => i.status === 'PAID')
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0)
  const pendingRevenue = invoices.filter(i => i.status === 'SENT' || i.status === 'PARTIALLY_PAID').reduce((sum, i) => sum + i.balanceDue, 0)
  const overdueRevenue = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + i.balanceDue, 0)

  const revenueByClient: Record<string, number> = {}
  paidInvoices.forEach(inv => {
    const name = inv.client?.displayName ?? 'Unknown'
    revenueByClient[name] = (revenueByClient[name] || 0) + inv.totalAmount
  })
  const topClients = Object.entries(revenueByClient).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Pipeline tab
  const opportunities = oppsResponse?.data ?? []
  const pipelineStages = ['Discovery', 'Proposal', 'Negotiation', 'Contract', 'Closed Won', 'Closed Lost']
  const stageData = pipelineStages.map(stage => {
    const opps = opportunities.filter(o => o.stage === stage)
    return { stage, count: opps.length, value: opps.reduce((sum, o) => sum + o.value, 0) }
  })
  const activeOpps = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage))
  const totalPipeline = activeOpps.reduce((sum, o) => sum + o.value, 0)
  const weightedPipeline = activeOpps.reduce((sum, o) => sum + o.weightedValue, 0)
  const closedOpps = opportunities.filter(o => ['Closed Won', 'Closed Lost'].includes(o.stage))
  const wonOpps = opportunities.filter(o => o.stage === 'Closed Won')
  const winRate = closedOpps.length > 0 ? Math.round((wonOpps.length / closedOpps.length) * 100) : 0

  // Team tab
  const users = usersResponse?.data ?? []
  const leads = leadsResponse?.data ?? []
  const team = users.map(user => {
    const fullName = `${user.firstName} ${user.lastName}`
    const assignedLeads = leads.filter(l => l.assignedTo?.id === user.id).length
    const ownedOpps = opportunities.filter(o => o.owner?.id === user.id)
    const wonValue = ownedOpps.filter(o => o.stage === 'Closed Won').reduce((sum, o) => sum + o.value, 0)
    const activeOppCount = ownedOpps.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length
    return { id: user.id, name: fullName, role: user.jobTitle, assignedLeads, activeOpps: activeOppCount, wonValue }
  })

  // Retention tab
  const companies = companiesResponse?.data ?? []
  const customerCompanies = companies.filter(c => c.lifecycleStage === 'Customer')
  const avgHealth = customerCompanies.length > 0
    ? Math.round(customerCompanies.reduce((sum, c) => sum + c.healthScore, 0) / customerCompanies.length)
    : 0
  const atRisk = customerCompanies.filter(c => c.healthScore < 50)
  const healthy = customerCompanies.filter(c => c.healthScore >= 70)

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
                <p className="text-2xl font-bold mt-1">AED {totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{paidInvoices.length} paid invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pending Revenue</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">AED {pendingRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Overdue Revenue</p>
                <p className="text-2xl font-bold mt-1 text-red-600">AED {overdueRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Needs follow-up</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                <div className="space-y-3">
                  {topClients.map(([name, value], i) => (
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
                <p className="text-2xl font-bold mt-1">{activeOpps.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">AED {totalPipeline.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Weighted Value</p>
                <p className="text-2xl font-bold mt-1">AED {weightedPipeline.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold mt-1">{winRate}%</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stageData.map(({ stage, count, value }) => (
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
                    {team.length > 0 ? team.map(member => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{member.name}</td>
                        <td className="py-3 text-muted-foreground">{member.role ?? '-'}</td>
                        <td className="py-3 text-center">{member.assignedLeads}</td>
                        <td className="py-3 text-center">{member.activeOpps}</td>
                        <td className="py-3 text-end font-semibold">
                          {member.wonValue > 0 ? `AED ${member.wonValue.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">No team data available</td>
                      </tr>
                    )}
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
                <p className="text-2xl font-bold mt-1">{customerCompanies.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Health Score</p>
                <p className="text-2xl font-bold mt-1">{avgHealth}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{healthy.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{atRisk.length}</p>
              </CardContent>
            </Card>
          </div>
          {atRisk.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">At-Risk Clients (Health &lt; 50)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {atRisk.map(company => (
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
          {healthy.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Healthy Clients (Health &ge; 70)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthy.map(company => (
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
          {customerCompanies.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No customer data available yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
