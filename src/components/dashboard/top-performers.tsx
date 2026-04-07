'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const performers = [
  { name: 'Sarah Al-Rashid', role: 'Sales Director', deals: 4, value: 225000, wonRate: 75 },
  { name: 'Omar Hassan', role: 'Senior Sales Rep', deals: 3, value: 73000, wonRate: 60 },
  { name: 'Ahmed Noor', role: 'Junior Sales Rep', deals: 2, value: 93000, wonRate: 50 },
  { name: 'Layla Mahmoud', role: 'Account Manager', deals: 1, value: 96000, wonRate: 80 },
]

export function TopPerformers() {
  const t = useTranslations('dashboard')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t('topPerformers')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {performers.map((person, i) => (
          <div key={person.name} className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-bold dark:bg-blue-950 dark:text-blue-300">
              {i + 1}
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground">{person.deals} deals · {person.wonRate}% win rate</p>
            </div>
            <div className="text-end">
              <p className="text-sm font-semibold">AED {(person.value / 1000).toFixed(0)}K</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
