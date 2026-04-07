'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getInitials, formatDate, formatCurrency } from '@/lib/utils'
import { projects } from '@/lib/demo-data'

type Project = (typeof projects)[number]

export function ProjectsTable() {
  const router = useRouter()
  const t = useTranslations('projects')

  const columns: ColumnDef<Project, unknown>[] = [
    {
      accessorKey: 'projectNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.projectNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.client.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'healthStatus',
      header: t('health'),
      cell: ({ row }) => <StatusBadge status={row.original.healthStatus.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'progressPercent',
      header: t('progress'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={row.original.progressPercent} className="flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-end">
            {row.original.progressPercent}%
          </span>
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: 'owner',
      header: t('owner'),
      cell: ({ row }) => {
        const owner = row.original.owner
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {getInitials(owner.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{owner.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'budget',
      header: t('budget'),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{formatCurrency(row.original.budget, row.original.currency)}</span>
      ),
    },
    {
      accessorKey: 'targetEndDate',
      header: t('targetEndDate'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.targetEndDate ? formatDate(row.original.targetEndDate) : '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={projects}
      searchPlaceholder={`${t('title')}...`}
      onRowClick={(project) => router.push(`/projects/${project.id}`)}
    />
  )
}
