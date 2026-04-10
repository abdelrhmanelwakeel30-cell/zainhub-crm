'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'

interface Task {
  id: string
  taskNumber: string
  title: string
  status: string
  priority: string
  dueDate: string
  assignedTo?: { firstName: string; lastName: string } | null
  project?: { id: string; name: string } | null
  _count?: { subtasks: number }
}

export function TasksTable() {
  const router = useRouter()
  const t = useTranslations('tasks')

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then(r => r.json()),
  })

  const tasks: Task[] = data?.data ?? []

  const columns: ColumnDef<Task, unknown>[] = [
    {
      accessorKey: 'taskNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.taskNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'title',
      header: t('taskTitle'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.project && (
            <p className="text-xs text-muted-foreground">{row.original.project.name}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'priority',
      header: t('priority'),
      cell: ({ row }) => <StatusBadge status={row.original.priority} />,
    },
    {
      accessorKey: 'assignedTo',
      header: t('assignedTo'),
      cell: ({ row }) => {
        const user = row.original.assignedTo
        if (!user) return <span className="text-xs text-muted-foreground italic">{t('unassigned')}</span>
        const fullName = `${user.firstName} ${user.lastName}`
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'dueDate',
      header: t('dueDate'),
      cell: ({ row }) => {
        const due = new Date(row.original.dueDate)
        const isOverdue = due < new Date() && row.original.status !== 'COMPLETED'
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {formatDate(row.original.dueDate)}
          </span>
        )
      },
    },
    {
      accessorKey: 'project',
      header: t('project'),
      cell: ({ row }) => {
        const project = row.original.project
        if (!project) return <span className="text-xs text-muted-foreground italic">{t('noProject')}</span>
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/projects/${project.id}`)
            }}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {project.name}
          </button>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={tasks}
      isLoading={isLoading}
      searchPlaceholder={`${t('title')}...`}
      onRowClick={(task) => router.push(`/tasks/${task.id}`)}
    />
  )
}
