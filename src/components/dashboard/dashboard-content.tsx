'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
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

interface DashboardContentProps {
  user: {
    firstName: string
    lastName: string
    [key: string]: any
  }
}

interface DashboardKPIs {
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
  revenueGrowth: number
  paidInvoicesThisMonth: number
  overdueInvoices: number
  unreadNotifications: number
}

interface DashboardData {
  kpis: DashboardKPIs
  charts: {
    pipeline: any[]
    leadsBySource: any[]
    revenueByMonth: any[]
  }
  recentActivities: any[]
}

interface DashboardResponse {
  success: boolean
  data: DashboardData
}

export function DashboardContent({ user }: DashboardContentProps) {
  const t = useTranslations('dashboard')

  const { data, isLoading } = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      return res.json()
    },
  })

  const kpis = data?.data?.kpis

  const pipelineValue = kpis?.pipelineValue ?? 0
  const monthlyRevenue = kpis?.monthlyRevenue ?? 0

  const pipelineDisplay = pipelineValue >= 1_000_000
    ? `${(pipelineValue / 1_000_000).toFixed(1)}M`
    : `${(pipelineValue / 1_000).toFixed(0)}K`

  const revenueDisplay = monthlyRevenue >= 1_000_000
    ? `${(monthlyRevenue / 1_000_000).toFixed(1)}M`
    : `${(monthlyRevenue / 1_000).toFixed(0)}K`

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
          value={isLoading ? '—' : (kpis?.totalLeads ?? 0)}
          icon={<Target className="h-5 w-5" />}
        />
        <KPICard
          title={t('activeOpportunities')}
          value={isLoading ? '—' : (kpis?.openOpportunities ?? 0)}
          icon={<Handshake className="h-5 w-5" />}
        />
        <KPICard
          title={t('pipelineValue')}
          value={isLoading ? '—' : pipelineDisplay}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title={t('conversionRate')}
          value={isLoading ? '—' : `${kpis?.revenueGrowth ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* KPI Row 2 - Operations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('monthlyRevenue')}
          value={isLoading ? '—' : revenueDisplay}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title={t('overdueInvoices')}
          value={isLoading ? '—' : (kpis?.overdueInvoices ?? 0)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <KPICard
          title={t('activeProjects')}
          value={isLoading ? '—' : (kpis?.activeProjects ?? 0)}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <KPICard
          title={t('pendingTasks')}
          value={isLoading ? '—' : (kpis?.overdueTasks ?? 0)}
          icon={<ListTodo className="h-5 w-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data?.data?.charts?.revenueByMonth} />
        <LeadsBySourceChart data={data?.data?.charts?.leadsBySource} />
      </div>

      {/* Pipeline + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineChart data={data?.data?.charts?.pipeline} />
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
