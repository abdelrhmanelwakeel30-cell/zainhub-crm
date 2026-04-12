'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeDate } from '@/lib/utils'
import { Activity } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-green-600 bg-green-50 dark:bg-green-950',
  UPDATE: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
  DELETE: 'text-red-600 bg-red-50 dark:bg-red-950',
  ARCHIVE: 'text-amber-600 bg-amber-50 dark:bg-amber-950',
}

interface ActivityRecord {
  id: string
  action?: string | null
  entityType: string
  entityName?: string | null
  createdAt: string
  user?: { firstName: string; lastName: string } | null
  performedBy?: { firstName: string; lastName: string } | null
}

export function RecentActivity() {
  const t = useTranslations('dashboard')

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => fetch('/api/dashboard').then(r => r.json()),
    staleTime: 60_000,
    select: (d) => d?.data?.recentActivities ?? [],
  })

  const activities: ActivityRecord[] = data ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))
        ) : activities.length > 0 ? activities.map((activity) => {
          const action = activity.action ?? 'UPDATE'
          const colorClass = ACTION_COLORS[action] ?? 'text-gray-600 bg-gray-50'
          const actor = activity.user ?? activity.performedBy
          const userName = actor ? `${actor.firstName} ${actor.lastName}` : 'System'
          const actionLabel = action.charAt(0) + action.slice(1).toLowerCase()
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{userName}</span>{' '}
                  <span className="text-muted-foreground">{actionLabel.toLowerCase()}</span>{' '}
                  <span className="font-medium">{activity.entityName ?? activity.entityType}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.entityType} · {formatRelativeDate(activity.createdAt)}
                </p>
              </div>
            </div>
          )
        }) : (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  )
}
