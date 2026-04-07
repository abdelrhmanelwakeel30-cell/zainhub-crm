'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeDate } from '@/lib/utils'
import { Target, Handshake, Building2, Phone, Mail, FileText } from 'lucide-react'

const activities = [
  { id: 1, user: 'Sarah Al-Rashid', action: 'moved opportunity', target: 'Dubai Holding Website Redesign', detail: 'to Contract stage', icon: Handshake, color: 'text-blue-600 bg-blue-50', time: new Date(Date.now() - 1800000) },
  { id: 2, user: 'Omar Hassan', action: 'created lead', target: 'Tariq Al-Muhairi', detail: 'from Website', icon: Target, color: 'text-indigo-600 bg-indigo-50', time: new Date(Date.now() - 3600000) },
  { id: 3, user: 'Ahmed Noor', action: 'sent proposal to', target: 'Abu Dhabi Ports', detail: 'AED 18,000', icon: FileText, color: 'text-green-600 bg-green-50', time: new Date(Date.now() - 7200000) },
  { id: 4, user: 'Layla Mahmoud', action: 'called', target: 'Khalid Bin Saeed', detail: 'MAF - 12 min', icon: Phone, color: 'text-cyan-600 bg-cyan-50', time: new Date(Date.now() - 14400000) },
  { id: 5, user: 'Sarah Al-Rashid', action: 'added company', target: 'STC Group', detail: 'Riyadh, KSA', icon: Building2, color: 'text-purple-600 bg-purple-50', time: new Date(Date.now() - 28800000) },
  { id: 6, user: 'Omar Hassan', action: 'emailed', target: 'Nadia Bakri', detail: 'Follow-up on website project', icon: Mail, color: 'text-orange-600 bg-orange-50', time: new Date(Date.now() - 43200000) },
]

export function RecentActivity() {
  const t = useTranslations('dashboard')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${activity.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activity.detail} · {formatRelativeDate(activity.time)}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
