'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, CalendarClock, User, FolderKanban, Clock,
} from 'lucide-react'

interface TaskDetailProps {
  taskId: string
}

interface Task {
  id: string
  taskNumber: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate: string
  createdAt: string
  completedAt?: string | null
  assignedTo?: { firstName: string; lastName: string } | null
  project?: { id: string; name: string } | null
  subtasks?: unknown[]
  comments?: { id: string; body: string; createdAt: string; author: { firstName: string; lastName: string } }[]
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  const t = useTranslations('tasks')
  const tc = useTranslations('common')
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => fetch(`/api/tasks/${taskId}`).then(r => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  const task: Task | undefined = data?.data

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">{t('taskNotFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/tasks')}>
          <ArrowLeft className="h-4 w-4 me-2" />
          {t('backToTasks')}
        </Button>
      </div>
    )
  }

  const assignedToName = task.assignedTo
    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
    : null

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to tasks" onClick={() => router.push('/tasks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{task.title}</h1>
              <StatusBadge status={task.priority} />
              <StatusBadge status={task.status.replace(/_/g, ' ')} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {task.taskNumber} · {task.project ? task.project.name : t('noProject')} · {t('createdAt')} {formatRelativeDate(task.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">{t('editTask')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow
                  icon={<FolderKanban className="h-4 w-4" />}
                  label={t('project')}
                  value={task.project ? task.project.name : t('noProject')}
                  link={task.project ? `/projects/${task.project.id}` : undefined}
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label={t('assignedTo')}
                  value={assignedToName ?? t('unassigned')}
                />
                <InfoRow
                  icon={<CalendarClock className="h-4 w-4" />}
                  label={t('dueDate')}
                  value={formatDate(task.dueDate)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label={t('createdAt')}
                  value={formatDate(task.createdAt)}
                />
              </div>
              {task.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">{t('description')}</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Tabs */}
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">{tc('timeline')}</TabsTrigger>
              <TabsTrigger value="notes">{tc('notes')}</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {buildTimeline(task).map((event, i, arr) => (
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
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={task.status.replace(/_/g, ' ')} />
            </CardContent>
          </Card>

          {/* Priority */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('priority')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={task.priority} />
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('assignedTo')}</CardTitle>
            </CardHeader>
            <CardContent>
              {task.assignedTo ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(assignedToName!)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{assignedToName}</p>
                    <p className="text-xs text-muted-foreground">Team Member</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground italic">{t('unassigned')}</p>
                  <Button variant="outline" size="sm" className="mt-2">{tc('add')}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, link }: { icon: React.ReactNode; label: string; value?: string | null; link?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {link ? (
          <a href={link} className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            {value || '-'}
          </a>
        ) : (
          <p className="text-sm font-medium">{value || '-'}</p>
        )}
      </div>
    </div>
  )
}

type TimelineEvent = { action: string; detail: string; time: string }

function buildTimeline(task: Task): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { action: 'Task created', detail: task.project ? `Project: ${task.project.name}` : 'No project', time: task.createdAt },
  ]

  if (task.assignedTo) {
    const assignedName = `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
    events.push({ action: `Assigned to ${assignedName}`, detail: '', time: task.createdAt })
  }

  if (task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW' || task.status === 'COMPLETED') {
    events.push({ action: 'Status changed to In Progress', detail: '', time: task.createdAt })
  }

  if (task.status === 'IN_REVIEW') {
    events.push({ action: 'Submitted for review', detail: '', time: task.dueDate })
  }

  if (task.completedAt) {
    events.push({ action: 'Task completed', detail: '', time: task.completedAt })
  }

  // Most recent first
  return events.reverse()
}
