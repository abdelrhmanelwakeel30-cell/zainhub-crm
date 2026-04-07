'use client'

import { useTranslations } from 'next-intl'
import { KPICard } from '@/components/shared/kpi-card'
import { RevenueChart } from './charts/revenue-chart'
import { LeadsBySourceChart } from './charts/leads-by-source-chart'
import { PipelineChart } from './charts/pipeline-chart'
import { RecentActivity } from './recent-activity'
import { UrgentItems } from './urgent-items'
import { TopPerformers } from './top-performers'
import {
  Target, Handshake, DollarSign, TrendingUp,
  Briefcase, Receipt, ListTodo, Users
} from 'lucide-react'
import { leads, opportunities, invoices, projects, tasks } from '@/lib/demo-data'

interface DashboardContentProps {
  user: {
    firstName: string
    lastName: string
    [key: string]: any
  }
}

function computeKPIs() {
  const totalLeads = leads.length
  const activeOpportunities = opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length
  const pipelineValue = opportunities
    .filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage))
    .reduce((sum, o) => sum + o.value, 0)
  const closedOpps = opportunities.filter(o => ['Closed Won', 'Closed Lost'].includes(o.stage))
  const wonOpps = opportunities.filter(o => o.stage === 'Closed Won')
  const conversionRate = closedOpps.length > 0 ? Math.round((wonOpps.length / closedOpps.length) * 100) : 0
  const paidInvoices = invoices.filter(i => i.status === 'PAID')
  const monthlyRevenue = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0)
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE').length
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'REVIEW').length
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length

  return { totalLeads, activeOpportunities, pipelineValue, conversionRate, monthlyRevenue, overdueInvoices, activeProjects, pendingTasks }
}

export function DashboardContent({ user }: DashboardContentProps) {
  const t = useTranslations('dashboard')
  const kpi = computeKPIs()

  const pipelineDisplay = kpi.pipelineValue >= 1000000
    ? `${(kpi.pipelineValue / 1000000).toFixed(1)}M`
    : `${(kpi.pipelineValue / 1000).toFixed(0)}K`
  const revenueDisplay = kpi.monthlyRevenue >= 1000000
    ? `${(kpi.monthlyRevenue / 1000000).toFixed(1)}M`
    : `${(kpi.monthlyRevenue / 1000).toFixed(0)}K`

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('welcomeBack')}, {user.firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('todayOverview')}
        </p>
      </div>

      {/* KPI Row 1 - Sales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalLeads')}
          value={kpi.totalLeads}
          icon={<Target className="h-5 w-5" />}
        />
        <KPICard
          title={t('activeOpportunities')}
          value={kpi.activeOpportunities}
          icon={<Handshake className="h-5 w-5" />}
        />
        <KPICard
          title={t('pipelineValue')}
          value={pipelineDisplay}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title={t('conversionRate')}
          value={`${kpi.conversionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* KPI Row 2 - Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('monthlyRevenue')}
          value={revenueDisplay}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title={t('overdueInvoices')}
          value={kpi.overdueInvoices}
          icon={<Receipt className="h-5 w-5" />}
        />
        <KPICard
          title={t('activeProjects')}
          value={kpi.activeProjects}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <KPICard
          title={t('pendingTasks')}
          value={kpi.pendingTasks}
          icon={<ListTodo className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <LeadsBySourceChart />
      </div>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineChart />
        </div>
        <TopPerformers />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UrgentItems />
        <RecentActivity />
      </div>
    </div>
  )
}
