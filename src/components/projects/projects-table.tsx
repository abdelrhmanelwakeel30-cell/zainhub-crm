'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials, formatDate, formatCurrency } from '@/lib/utils'

type Project = {
  id: string
  projectNumber: string
  name: string
  client: { displayName: string }
  owner: { firstName: string; lastName: string }
  status: string
  startDate?: string
  endDate?: string
  budget: number
  currency: string
}

export function ProjectsTable() {
  const router = useRouter()
  const t = useTranslations('projects')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json()),
  })

  const projects: Project[] = data?.data ?? []

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
          <p className="text-xs text-muted-foreground">{row.original.client?.displayName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'owner',
      header: t('owner'),
      cell: ({ row }) => {
        const owner = row.original.owner
        const name = owner ? `${owner.firstName} ${owner.lastName}` : '-'
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{name}</span>
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
      accessorKey: 'endDate',
      header: t('targetEndDate'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.endDate ? formatDate(row.original.endDate) : '-'}
        </span>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-red-500 py-8 text-center">Failed to load projects.</p>
  }

  return (
    <DataTable
      columns={columns}
      data={projects}
      searchPlaceholder={`${t('title')}...`}
      onRowClick={(project) => router.push(`/projects/${project.id}`)}
    />
  )
}
