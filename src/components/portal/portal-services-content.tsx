'use client'

import { useQuery } from '@tanstack/react-query'
import { usePortalAuth } from './portal-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Package, ArrowRight, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ClientService {
  id: string
  clientServiceNumber: string
  serviceName: string
  status: string
  startDate: string | null
  endDate: string | null
  assignedTo: { firstName: string; lastName: string } | null
  milestones: Array<{ status: string }>
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  PENDING_SETUP: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function getMilestoneProgress(milestones: Array<{ status: string }>): number {
  if (!milestones.length) return 0
  const done = milestones.filter((m) => m.status === 'COMPLETED').length
  return Math.round((done / milestones.length) * 100)
}

function ServiceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  )
}

export function PortalServicesContent() {
  const { token } = usePortalAuth()

  const { data, isLoading } = useQuery<{ success: boolean; data: ClientService[] }>({
    queryKey: ['portal-services'],
    queryFn: () =>
      fetch('/api/client-portal/services', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  })

  const services = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          My Services
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isLoading ? 'Loading...' : `${services.length} service${services.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      ) : !services.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No services found for your account.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => {
            const progress = getMilestoneProgress(svc.milestones)
            return (
              <Card
                key={svc.id}
                className="hover:shadow-md transition-shadow cursor-pointer group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{svc.serviceName}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{svc.clientServiceNumber}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${statusColors[svc.status] ?? ''}`}
                    >
                      {svc.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {svc.assignedTo && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{svc.assignedTo.firstName} {svc.assignedTo.lastName}</span>
                    </div>
                  )}

                  {svc.startDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Started {format(new Date(svc.startDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}

                  {svc.milestones.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}

                  <Link
                    href={`/portal/services/${svc.id}`}
                    className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all"
                  >
                    View details <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
