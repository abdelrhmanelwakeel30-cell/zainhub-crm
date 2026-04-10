'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials } from '@/lib/utils'

export function TopPerformers() {
  const t = useTranslations('dashboard')

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'top-performers'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    staleTime: 300_000,
  })

  const users: Array<{ id: string; firstName: string; lastName: string; jobTitle?: string }> = data?.data?.slice(0, 4) ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{t('topPerformers')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))
        ) : users.length > 0 ? users.map((person, i) => (
          <div key={person.id} className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-700 text-xs font-bold dark:bg-blue-950 dark:text-blue-300">
              {i + 1}
            </div>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {getInitials(`${person.firstName} ${person.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{person.firstName} {person.lastName}</p>
              <p className="text-xs text-muted-foreground">{person.jobTitle ?? 'Team Member'}</p>
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
        )}
      </CardContent>
    </Card>
  )
}
