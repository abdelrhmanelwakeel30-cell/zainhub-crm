'use client'

import { useQuery } from '@tanstack/react-query'
import { usePortalAuth } from './portal-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Calendar, User, CheckCircle2, Circle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Milestone {
  id: string
  name: string
  description: string | null
  dueDate: string | null
  completedAt: string | null
  status: string
  order: number
}

interface TeamMember {
  id: string
  role: string
  user: { id: string; firstName: string; lastName: string; email: string }
}

interface Deliverable {
  id: string
  name: string
  type: string
  visibility: string
  fileName: string | null
}

interface ServiceDetail {
  id: string
  clientServiceNumber: string
  serviceName: string
  status: string
  startDate: string | null
  endDate: string | null
  notes: string | null
  assignedTo: { firstName: string; lastName: string } | null
  milestones: Milestone[]
  teamMembers: TeamMember[]
  deliverables: Deliverable[]
}

const milestoneIcons: Record<string, React.ElementType> = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Clock,
  PENDING: Circle,
  OVERDUE: Clock,
}

const milestoneColors: Record<string, string> = {
  COMPLETED: 'text-green-500',
  IN_PROGRESS: 'text-blue-500',
  PENDING: 'text-slate-400',
  OVERDUE: 'text-red-500',
}

export function PortalServiceDetailContent({ id }: { id: string }) {
  const { token } = usePortalAuth()

  const { data, isLoading } = useQuery<{ success: boolean; data: ServiceDetail }>({
    queryKey: ['portal-service', id],
    queryFn: () =>
      fetch(`/api/client-portal/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  })

  const svc = data?.data

  const completedMilestones = svc?.milestones.filter((m) => m.status === 'COMPLETED').length ?? 0
  const totalMilestones = svc?.milestones.length ?? 0
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/portal/services"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-600 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Link>

      {/* Header */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{svc?.serviceName}</h1>
            <p className="text-muted-foreground text-sm mt-1">{svc?.clientServiceNumber}</p>
          </div>
          {svc && (
            <Badge variant="outline" className="text-sm">{svc.status.replace(/_/g, ' ')}</Badge>
          )}
        </div>
      )}

      {/* Overview card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Service Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : (
            <>
              {svc?.assignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">Project Manager</p>
                    <p className="font-medium">{svc.assignedTo.firstName} {svc.assignedTo.lastName}</p>
                  </div>
                </div>
              )}
              {svc?.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">Start Date</p>
                    <p className="font-medium">{format(new Date(svc.startDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
              {svc?.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-muted-foreground text-xs">End Date</p>
                    <p className="font-medium">{format(new Date(svc.endDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Milestones</CardTitle>
            {!isLoading && totalMilestones > 0 && (
              <span className="text-sm text-muted-foreground">
                {completedMilestones}/{totalMilestones} completed
              </span>
            )}
          </div>
          {!isLoading && totalMilestones > 0 && (
            <Progress value={progress} className="h-1.5 mt-2" />
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : !svc?.milestones.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">No milestones defined.</p>
          ) : (
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
              {svc.milestones
                .sort((a, b) => a.order - b.order)
                .map((milestone) => {
                  const Icon = milestoneIcons[milestone.status] ?? Circle
                  const color = milestoneColors[milestone.status] ?? 'text-slate-400'
                  return (
                    <div key={milestone.id} className="flex gap-3 relative">
                      <Icon className={`h-5 w-5 ${color} shrink-0 bg-white dark:bg-slate-900 relative z-10`} />
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-medium">{milestone.name}</p>
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {milestone.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          {milestone.completedAt && (
                            <span className="text-xs text-green-600">
                              Completed {format(new Date(milestone.completedAt), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      {(isLoading || (svc?.teamMembers?.length ?? 0) > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {svc?.teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-sm font-semibold">
                      {member.user.firstName[0]}{member.user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.role.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Deliverables */}
      {(isLoading || (svc?.deliverables?.length ?? 0) > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Deliverables</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {svc?.deliverables.map((d) => (
                  <div key={d.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <p className="text-sm">{d.name}</p>
                    <div className="flex items-center gap-2">
                      {d.fileName && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {d.fileName}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">{d.type.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
