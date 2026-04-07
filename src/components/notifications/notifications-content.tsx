'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, CheckCheck, Target, Receipt, Briefcase, HeadphonesIcon, ListTodo } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'

const now = Date.now()
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString()
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString()

const initialNotifications = [
  { id: 'n-1', type: 'lead', title: 'New lead assigned', body: 'Tariq Al-Muhairi from Emirates NBD has been assigned to you', isRead: false, time: hoursAgo(0.17), icon: Target },
  { id: 'n-2', type: 'invoice', title: 'Invoice overdue', body: 'INV-0004 for Dubai Holding is 10 days overdue (AED 63,000)', isRead: false, time: hoursAgo(1), icon: Receipt },
  { id: 'n-3', type: 'ticket', title: 'Urgent ticket opened', body: 'TKT-0002: Chatbot response time exceeds 5s - Priority: URGENT', isRead: false, time: hoursAgo(2), icon: HeadphonesIcon },
  { id: 'n-4', type: 'task', title: 'Task due tomorrow', body: 'TSK-0011: Create social content calendar for April - Due tomorrow', isRead: false, time: hoursAgo(3), icon: ListTodo },
  { id: 'n-5', type: 'deal', title: 'Deal won!', body: 'Opportunity "Brand Identity Refresh" with MAF has been marked as Won', isRead: true, time: daysAgo(1), icon: Briefcase },
  { id: 'n-6', type: 'lead', title: 'Lead score updated', body: 'Nadia Bakri score increased to 60 - now Qualified', isRead: true, time: daysAgo(1), icon: Target },
  { id: 'n-7', type: 'payment', title: 'Payment received', body: 'PAY-0004: AED 39,375 received from Property Finder', isRead: true, time: daysAgo(3), icon: Receipt },
  { id: 'n-8', type: 'ticket', title: 'Ticket resolved', body: 'TKT-0005: Instagram reel scheduling issue has been resolved', isRead: true, time: daysAgo(4), icon: HeadphonesIcon },
]

export function NotificationsContent() {
  const t = useTranslations('common')
  const [notifications, setNotifications] = useState(initialNotifications)
  const unread = notifications.filter(n => !n.isRead)

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('notifications')} description={`${unread.length} ${t('unread')}`}>
        <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 me-2" /> {t('markAllRead')}</Button>
      </PageHeader>

      <div className="space-y-2 max-w-3xl">
        {notifications.map(n => {
          const Icon = n.icon
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
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(n.time)}</p>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => markRead(n.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
