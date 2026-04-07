'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { projects, tasks } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatDate, formatCurrency, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Calendar, DollarSign, Target, Users,
  CheckCircle2, Clock, AlertTriangle, Milestone,
} from 'lucide-react'

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const router = useRouter()

  const project = projects.find(p => p.id === projectId)

  if (!project) {
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

  const linkedTasks = tasks.filter(task => task.project?.id === project.id)

  const milestoneIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-amber-600" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const healthColor = (health: string) => {
    switch (health) {
      case 'ON_TRACK': return 'text-green-600'
      case 'AT_RISK': return 'text-amber-600'
      case 'DELAYED': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <StatusBadge status={project.status.replace(/_/g, ' ')} />
              <StatusBadge status={project.healthStatus.replace(/_/g, ' ')} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {project.projectNumber} · {project.client.name} · {project.service}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            {t('editProject')}
          </Button>
        </div>
      </div>

      {/* Deal Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label={t('budget')}
          value={formatCurrency(project.budget, project.currency)}
        />
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label={t('actualCost')}
          value={formatCurrency(project.actualCost, project.currency)}
        />
        <SummaryCard
          icon={<Target className="h-4 w-4" />}
          label={t('progress')}
          value={`${project.progressPercent}%`}
        />
        <SummaryCard
          icon={<Calendar className="h-4 w-4" />}
          label={t('targetEndDate')}
          value={project.targetEndDate ? formatDate(project.targetEndDate) : '-'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('progress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{project.progressPercent}% {tc('complete') || 'complete'}</span>
                  <span className={healthColor(project.healthStatus)}>
                    {project.healthStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <Progress value={project.progressPercent} />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t('milestones')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('tasks')}</TabsTrigger>
              <TabsTrigger value="timeline">{tc('timeline')}</TabsTrigger>
            </TabsList>

            {/* Milestones Tab */}
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {project.milestones.length > 0 ? (
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

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {linkedTasks.length > 0 ? (
                    <div className="space-y-3">
                      {linkedTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">{task.taskNumber}</span>
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.assignedTo?.name || 'Unassigned'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={task.priority} />
                            <StatusBadge status={task.status.replace(/_/g, ' ')} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('noTasks')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {buildTimeline(project).map((event, i, arr) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                          {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">{event.action}</p>
                          {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(event.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Owner */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('owner')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(project.owner.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{project.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{t('projectManager')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('health')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${healthColor(project.healthStatus)}`} />
                <StatusBadge status={project.healthStatus.replace(/_/g, ' ')} />
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('teamMembers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.members.length > 0 ? (
                <div className="space-y-3">
                  {project.members.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No team members</p>
              )}
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
                {project.actualEndDate && (
                  <InfoRow
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label={t('actualEndDate')}
                    value={formatDate(project.actualEndDate)}
                  />
                )}
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

type TimelineEvent = { action: string; detail: string; time: string }

function buildTimeline(project: (typeof projects)[number]): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { action: 'Project created', detail: `Service: ${project.service}`, time: project.createdAt },
  ]

  if (project.startDate) {
    events.push({ action: 'Project started', detail: `Owner: ${project.owner.name}`, time: project.startDate })
  }

  project.milestones.forEach(m => {
    if (m.status === 'COMPLETED') {
      events.push({ action: `Milestone completed: ${m.name}`, detail: '', time: m.dueDate })
    }
  })

  if (project.actualEndDate) {
    events.push({ action: 'Project completed', detail: `Final cost: ${formatCurrency(project.actualCost, project.currency)}`, time: project.actualEndDate })
  }

  // Most recent first
  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}
