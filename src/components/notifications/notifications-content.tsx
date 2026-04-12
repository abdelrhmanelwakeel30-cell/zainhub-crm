'use client'

import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, CheckCheck, Target, Receipt, Briefcase, HeadphonesIcon, ListTodo, Bell } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  actionUrl: string | null
}

interface NotificationsApiResponse {
  success: boolean
  data: Notification[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const typeIconMap: Record<string, React.ElementType> = {
  lead: Target,
  invoice: Receipt,
  ticket: HeadphonesIcon,
  task: ListTodo,
  deal: Briefcase,
  payment: Receipt,
}

export function NotificationsContent() {
  const t = useTranslations('common')
  const queryClient = useQueryClient()

  const { data: response } = useQuery<NotificationsApiResponse>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(r => r.json()),
  })

  const notifications = response?.data ?? []
  const unread = notifications.filter(n => !n.isRead)

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      fetch('/api/notifications/read-all', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('notifications')} description={`${unread.length} ${t('unread')}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || unread.length === 0}
        >
          <CheckCheck className="h-4 w-4 me-2" /> {t('markAllRead')}
        </Button>
      </PageHeader>

      <div className="space-y-2 max-w-3xl">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(n => {
            const Icon = typeIconMap[n.type] ?? Bell
            return (
              <Card key={n.id} className={n.isRead ? 'opacity-60' : 'border-blue-200 dark:border-blue-900'}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${n.isRead ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-blue-100 dark:bg-blue-900 text-blue-600'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.isRead && <Badge className="h-4 px-1.5 text-[10px]">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mark as read"
                      className="shrink-0"
                      onClick={() => markReadMutation.mutate(n.id)}
                      disabled={markReadMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
