'use client'

import { useQuery } from '@tanstack/react-query'
import { usePortalAuth } from './portal-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, GitPullRequest, CheckSquare, Clock, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  activeServices: number
  openChangeRequests: number
  pendingApprovals: number
  openTickets: number
  recentActivity: Array<{
    id: string
    type: string
    title: string
    status: string
    createdAt: string
  }>
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  isLoading: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color} opacity-80`} />
        </div>
      </CardContent>
    </Card>
  )
}

export function PortalDashboardContent() {
  const { user, token } = usePortalAuth()

  const { data, isLoading } = useQuery<{ success: boolean; data: DashboardStats }>({
    queryKey: ['portal-dashboard'],
    queryFn: () =>
      fetch('/api/client-portal/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  })

  const stats = data?.data

  const kpis = [
    {
      label: 'Active Services',
      value: stats?.activeServices ?? 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      label: 'Open Change Requests',
      value: stats?.openChangeRequests ?? 0,
      icon: GitPullRequest,
      color: 'text-amber-600',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals ?? 0,
      icon: CheckSquare,
      color: 'text-purple-600',
    },
    {
      label: 'Open Tickets',
      value: stats?.openTickets ?? 0,
      icon: Clock,
      color: 'text-red-500',
    },
  ]

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    OPEN: 'bg-purple-100 text-purple-700',
    DRAFT: 'bg-slate-100 text-slate-700',
    IN_REVIEW: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hi, {user?.firstName ?? 'there'}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome to your client portal. Here&apos;s an overview of your account.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} isLoading={isLoading} />
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No recent activity to show.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 border-b last:border-0 border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type} &middot;{' '}
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`text-xs shrink-0 ${statusColors[item.status] ?? 'bg-slate-100 text-slate-600'}`}
                    variant="outline"
                  >
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
