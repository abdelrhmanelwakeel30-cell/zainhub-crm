'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatRelativeDate } from '@/lib/utils'
import { leads } from '@/lib/demo-data'

type Lead = (typeof leads)[number]

export function LeadsTable() {
  const router = useRouter()
  const t = useTranslations('leads')

  const columns: ColumnDef<Lead, unknown>[] = [
    {
      accessorKey: 'leadNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.leadNumber}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'fullName',
      header: t('fullName'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.fullName}</p>
          {row.original.companyName && (
            <p className="text-xs text-muted-foreground">{row.original.companyName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stage',
      header: t('stage'),
      cell: ({ row }) => <StatusBadge status={row.original.stage} />,
    },
    {
      accessorKey: 'source',
      header: t('source'),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.source}</span>
      ),
    },
    {
      accessorKey: 'urgency',
      header: t('urgency'),
      cell: ({ row }) => <StatusBadge status={row.original.urgency} />,
    },
    {
      accessorKey: 'score',
      header: t('score'),
      cell: ({ row }) => <ScoreIndicator score={row.original.score} size="sm" />,
    },
    {
      accessorKey: 'assignedTo',
      header: t('assignedTo'),
      cell: ({ row }) => {
        const user = row.original.assignedTo
        if (!user) return <span className="text-xs text-muted-foreground italic">Unassigned</span>
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{user.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'interestedService',
      header: t('interestedService'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.interestedService}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatRelativeDate(row.original.createdAt)}</span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={leads}
      searchPlaceholder={`${t('title')}...`}
      onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
    />
  )
}
