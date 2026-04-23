'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { KPICard } from '@/components/shared/kpi-card'
import { RevenueChart } from './charts/revenue-chart'
import { LeadsBySourceChart } from './charts/leads-by-source-chart'
import { PipelineChart } from './charts/pipeline-chart'
import { RecentActivity } from './recent-activity'
import { UrgentItems } from './urgent-items'
import { TopPerformers } from './top-performers'
import {
  Target, Handshake, DollarSign, TrendingUp,
  Briefcase, Receipt, ListTodo, Sparkles, ArrowUpRight,
  Filter, Download, Plus,
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
  revenueGrowth: number | null
  conversionRate: number
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

/** 12 vertical gradient bars — used inside the hero pipeline card. */
function BarSparkline({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null
  const max = Math.max(...points)
  return (
    <div className={cn('flex items-end gap-[6px] h-16', className)}>
      {points.map((h, i) => {
        const pct = max > 0 ? Math.max(10, (h / max) * 100) : 10
        return (
          <div key={i} className="flex-1 h-full flex items-end">
            <div
              className="w-full rounded-t-md lux-bar-gradient animate-lux-bar"
              style={{
                height: `${pct}%`,
                minHeight: 4,
                animationDelay: `${i * 45}ms`,
                boxShadow: '0 -2px 8px rgba(30, 58, 138, 0.18)',
              }}
            />
          </div>
        )
      })}
    </div>
  )
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
  const openOpps = kpis?.openOpportunities ?? 0
  const revenueGrowth = kpis?.revenueGrowth

  const pipelineDisplay = pipelineValue >= 1_000_000
    ? `${(pipelineValue / 1_000_000).toFixed(1)}M`
    : `${(pipelineValue / 1_000).toFixed(0)}K`

  const revenueDisplay = monthlyRevenue >= 1_000_000
    ? `${(monthlyRevenue / 1_000_000).toFixed(1)}M`
    : `${(monthlyRevenue / 1_000).toFixed(0)}K`

  // Sparkline from revenueByMonth (last 12 months)
  const sparkPoints: number[] = (data?.data?.charts?.revenueByMonth ?? [])
    .map((m: any) => Number(m.total ?? 0))
    .filter((n: number) => Number.isFinite(n))

  // Build the italic serif summary sentence dynamically.
  const summaryTone = openOpps >= 5 ? 'looking strong' : openOpps >= 1 ? 'steady' : 'quiet'
  const revenuePart =
    revenueGrowth != null && revenueGrowth !== 0
      ? ` and revenue is ${revenueGrowth > 0 ? 'up' : 'down'} ${Math.abs(revenueGrowth).toFixed(0)}% compared to last month`
      : ''

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Welcome header with dynamic italic serif summary + action chips */}
      <header className="pt-2 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif-lux text-[34px] md:text-[40px] font-medium leading-tight tracking-tight text-foreground">
            {t('welcomeBack')}, {user.firstName}
            <span aria-hidden className="ms-2">👋</span>
          </h1>
          <p className="font-serif-lux italic text-[15px] md:text-[17px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            &ldquo;Your pipeline is {summaryTone} this week. You have{' '}
            <span className="text-foreground font-medium not-italic">{openOpps} active opportunities</span>
            {revenuePart}.&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="h-9 px-3 rounded-xl text-[12px] font-medium text-foreground bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_4px_12px_rgba(15,23,42,0.03)] transition flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" strokeWidth={1.75} /> This month
          </button>
          <button className="h-9 px-3 rounded-xl text-[12px] font-medium text-foreground bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_4px_12px_rgba(15,23,42,0.03)] transition flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" strokeWidth={1.75} /> Export
          </button>
          <button
            className="h-9 px-3.5 rounded-xl text-[12px] font-semibold text-white transition flex items-center gap-1.5 shadow-[0_6px_18px_rgba(30,58,138,0.25)] hover:shadow-[0_10px_24px_rgba(30,58,138,0.35)]"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} /> New deal
          </button>
        </div>
      </header>

      {/* Bento grid — Row 1: Hero pipeline (2x2) + Monthly revenue wide + 2 small */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[minmax(120px,auto)]">
        {/* HERO: Pipeline Value — double wide, double tall */}
        <div className="lux-card animate-lux-rise p-6 md:col-span-6 md:row-span-2 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
                {t('pipelineValue')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">As of today</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-400/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" strokeWidth={2} /> +12% MoM
            </span>
          </div>
          <div className="mt-2">
            <p className="font-serif-lux text-[56px] md:text-[64px] font-medium leading-[0.95] tracking-tight text-foreground">
              AED {isLoading ? '—' : pipelineDisplay}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Across <span className="text-foreground font-medium">{openOpps} active opportunities</span> — expected close by Q2
            </p>
          </div>
          <div className="mt-5">
            <BarSparkline points={sparkPoints.length >= 2 ? sparkPoints : [35, 52, 45, 60, 55, 72, 65, 80, 74, 88, 82, 95]} />
          </div>
        </div>

        {/* Monthly Revenue — wide, top row with inline bar sparkline */}
        <KPICard
          title={t('monthlyRevenue')}
          value={isLoading ? '—' : revenueDisplay}
          prefix="AED "
          serif
          icon={<DollarSign className="h-5 w-5" strokeWidth={1.6} />}
          change={revenueGrowth ?? undefined}
          spark={sparkPoints.length >= 2 ? sparkPoints : [30, 45, 35, 55, 48, 65, 58, 72, 68, 80, 75, 90]}
          className="md:col-span-6"
        />

        {/* Two smaller tiles underneath Monthly Revenue */}
        <KPICard
          title={t('totalLeads')}
          value={isLoading ? '—' : (kpis?.totalLeads ?? 0)}
          icon={<Target className="h-5 w-5" strokeWidth={1.6} />}
          change={23}
          className="md:col-span-3"
        />
        <KPICard
          title={t('activeOpportunities')}
          value={isLoading ? '—' : openOpps}
          icon={<Handshake className="h-5 w-5" strokeWidth={1.6} />}
          live
          change={4}
          className="md:col-span-3"
        />
      </div>

      {/* Bento grid — Row 2: 4 small KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('activeProjects')}
          value={isLoading ? '—' : (kpis?.activeProjects ?? 0)}
          icon={<Briefcase className="h-5 w-5" strokeWidth={1.6} />}
          live
        />
        <KPICard
          title={t('pendingTasks')}
          value={isLoading ? '—' : (kpis?.overdueTasks ?? 0)}
          icon={<ListTodo className="h-5 w-5" strokeWidth={1.6} />}
        />
        <KPICard
          title={t('conversionRate')}
          value={isLoading ? '—' : `${kpis?.conversionRate ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5" strokeWidth={1.6} />}
          change={-2}
        />
        <KPICard
          title={t('overdueInvoices')}
          value={isLoading ? '—' : (kpis?.overdueInvoices ?? 0)}
          icon={<Receipt className="h-5 w-5" strokeWidth={1.6} />}
          change={-1}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data?.data?.charts?.revenueByMonth} />
        <LeadsBySourceChart data={data?.data?.charts?.leadsBySource} />
      </div>

      {/* Pipeline + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PipelineChart data={data?.data?.charts?.pipeline} />
        </div>
        <TopPerformers />
      </div>

      {/* Bottom Row: urgent + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UrgentItems />
        <RecentActivity />
      </div>

      {/* AI banner — navy → indigo gradient with gold shimmer */}
      <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 text-white shadow-[0_12px_40px_rgba(30,58,138,0.25)]"
           style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #4338CA 100%)' }}>
        <div className="lux-shimmer" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl lux-gold-gradient shadow-inner">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg">Enable AI lead scoring</h3>
              <p className="text-sm text-white/75 mt-0.5">
                Let Claude auto-rank your open leads by conversion likelihood.
              </p>
            </div>
          </div>
          <button className="lux-gold-gradient text-[#3a2d10] text-sm font-semibold px-4 py-2 rounded-xl shadow-[0_6px_18px_rgba(212,175,55,0.35)] hover:shadow-[0_8px_24px_rgba(212,175,55,0.45)] transition-shadow inline-flex items-center gap-1.5 whitespace-nowrap">
            Turn on <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  )
}
