'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { SubscriptionFormDialog } from './subscription-form-dialog'
import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/utils'
import { Plus, RefreshCw, DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Subscription {
  id: string
  name: string
  company: { id: string; displayName: string }
  amount: number
  currency: string
  interval: string
  status: string
  nextBillingDate: string
  autoRenew: boolean
}

function toMonthlyAmount(amount: number, interval: string): number {
  switch (interval) {
    case 'WEEKLY':      return amount * 4.33
    case 'BIWEEKLY':    return amount * 2.17
    case 'MONTHLY':     return amount
    case 'QUARTERLY':   return amount / 3
    case 'SEMI_ANNUAL': return amount / 6
    case 'ANNUAL':      return amount / 12
    default:            return amount
  }
}

const INTERVAL_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL: 'Annual',
}

const STATUS_TABS = ['All', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED']

export function SubscriptionsContent() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', activeTab],
    queryFn: () => {
      const params = new URLSearchParams({ pageSize: '100' })
      if (activeTab !== 'All') params.set('status', activeTab)
      return fetch(`/api/subscriptions?${params}`).then(r => r.json())
    },
  })

  const subscriptions: Subscription[] = data?.data ?? []

  const activeOnly = subscriptions.filter(s => s.status === 'ACTIVE')
  const mrr = activeOnly.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.interval), 0)

  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const dueThisMonth = subscriptions.filter(s => {
    const d = new Date(s.nextBillingDate)
    return d >= now && d <= endOfMonth
  }).length

  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = subscriptions.filter(s => {
    if (s.status !== 'ACTIVE') return false
    const d = new Date(s.nextBillingDate)
    return d >= now && d <= in30Days && !s.autoRenew
  }).length

  const columns: ColumnDef<Subscription, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <p className="font-medium text-sm">{row.original.name}</p>,
    },
    {
      accessorKey: 'company.displayName',
      header: 'Company',
      cell: ({ row }) => <p className="text-sm text-muted-foreground">{row.original.company.displayName}</p>,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.currency} {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'interval',
      header: 'Interval',
      cell: ({ row }) => (
        <span className="text-xs bg-muted px-2 py-1 rounded-md">
          {INTERVAL_LABELS[row.original.interval] ?? row.original.interval}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'nextBillingDate',
      header: 'Next Billing',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.nextBillingDate)}</span>
      ),
    },
    {
      accessorKey: 'autoRenew',
      header: 'Auto Renew',
      cell: ({ row }) => (
        <span className={`text-xs font-medium ${row.original.autoRenew ? 'text-green-600' : 'text-muted-foreground'}`}>
          {row.original.autoRenew ? 'Yes' : 'No'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Subscriptions" description={`${data?.total ?? 0} subscriptions`}>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> New Subscription
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Active"
          value={activeOnly.length}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <KPICard
          title="Monthly Recurring Revenue"
          value={Math.round(mrr).toLocaleString()}
          prefix="AED "
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          title="Due This Month"
          value={dueThisMonth}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title="Expiring Soon"
          value={expiringSoon}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={subscriptions}
          searchPlaceholder="Search subscriptions..."
          onRowClick={(sub) => router.push(`/subscriptions/${sub.id}`)}
        />
      )}

      <SubscriptionFormDialog open={showCreateForm} onOpenChange={setShowCreateForm} />
    </div>
  )
}
