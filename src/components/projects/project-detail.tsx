'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, DollarSign, Target, Users,
  CheckCircle2, Clock, AlertTriangle, FileText, Briefcase,
} from 'lucide-react'

interface ProjectDetailProps {
  projectId: string
}

type Milestone = { name: string; status: string; dueDate: string }
type Member = { assignedUser: { firstName: string; lastName: string }; role?: string }

type ProjectDetail = {
  id: string
  projectNumber: string
  name: string
  client: { displayName: string }
  owner: { firstName: string; lastName: string }
  opportunity?: { id: string; opportunityNumber: string; title: string; expectedValue: number } | null
  status: string
  startDate?: string
  targetEndDate?: string
  budgetValue: number | null
  currency: string
  milestones: Milestone[]
  tasks?: number | { count?: number } | { id: string; title: string; status: string }[]
  members: Member[]
  invoices?: unknown[]
  description?: string
  documents?: { id: string; name: string; fileType?: string | null; fileSize?: number | null; category: string; fileUrl: string; createdAt: string }[]
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => fetch('/api/projects/' + projectId).then(r => r.json()),
  })

  const project: ProjectDetail | undefined = data?.data

  const milestoneIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-amber-600" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to projects" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 me-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const ownerName = project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : '-'
  const taskCount = Array.isArray(project.tasks)
    ? project.tasks.length
    : typeof project.tasks === 'number'
      ? project.tasks
      : (project.tasks as { count?: number })?.count ?? 0

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to projects" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <StatusBadge status={project.status.replace(/_/g, ' ')} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {project.projectNumber} · {project.client?.displayName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            {t('editProject')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label={t('budget')}
          value={formatCurrency(project.budgetValue ?? 0, project.currency)}
        />
        <SummaryCard
          icon={<Target className="h-4 w-4" />}
          label={t('tasks')}
          value={String(taskCount)}
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label={t('teamMembers')}
          value={String(project.members?.length ?? 0)}
        />
        <SummaryCard
          icon={<Calendar className="h-4 w-4" />}
          label={t('targetEndDate')}
          value={project.targetEndDate ? formatDate(project.targetEndDate) : '-'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{tc('description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="milestones">
            <TabsList>
              <TabsTrigger value="milestones">{t('milestones')}</TabsTrigger>
              <TabsTrigger value="members">{t('teamMembers')}</TabsTrigger>
              <TabsTrigger value="documents">Documents ({project.documents?.length ?? 0})</TabsTrigger>
            </TabsList>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {project.milestones && project.milestones.length > 0 ? (
                    <div className="space-y-4">
                      {project.milestones.map((milestone, i, arr) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            {milestoneIcon(milestone.status)}
                            {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                          </div>
                          <div className="pb-4 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{milestone.name}</p>
                              <StatusBadge status={milestone.status.replace(/_/g, ' ')} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t('due')}: {formatDate(milestone.dueDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noMilestones')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {project.members && project.members.length > 0 ? (
                    <div className="space-y-3">
                      {project.members.map((member, i) => {
                        const name = member.assignedUser
                          ? `${member.assignedUser.firstName} ${member.assignedUser.lastName}`
                          : '-'
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              {member.role && <p className="text-xs text-muted-foreground">{member.role}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No team members</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {project.documents && project.documents.length > 0 ? (
                    <div className="space-y-3">
                      {project.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.category} · {doc.fileSize ? `${Math.round(doc.fileSize / 1024)}KB` : 'Unknown size'}
                              </p>
                            </div>
                          </div>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents attached to this project.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Opportunity Link */}
          {project.opportunity && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Source Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/opportunities/${project.opportunity.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {project.opportunity.title}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">{project.opportunity.opportunityNumber} · AED {Number(project.opportunity.expectedValue).toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
          {/* Owner */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('owner')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(ownerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{ownerName}</p>
                  <p className="text-xs text-muted-foreground">{t('projectManager')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dates')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('startDate')}
                  value={project.startDate ? formatDate(project.startDate) : 'Not set'}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label={t('targetEndDate')}
                  value={project.targetEndDate ? formatDate(project.targetEndDate) : 'Not set'}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
