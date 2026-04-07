'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getInitials, formatDate } from '@/lib/utils'
import { opportunities } from '@/lib/demo-data'

type Opportunity = (typeof opportunities)[number]

export function OpportunitiesTable() {
  const router = useRouter()
  const t = useTranslations('opportunities')

  const columns: ColumnDef<Opportunity, unknown>[] = [
    {
      accessorKey: 'opportunityNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.opportunityNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'title',
      header: t('dealName'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.company?.name}</p>
        </div>
      ),
    },
    {
      accessorKey: 'stage',
      header: t('stage'),
      cell: ({ row }) => <StatusBadge status={row.original.stage} />,
    },
    {
      accessorKey: 'value',
      header: t('value'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          AED {row.original.value.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'probability',
      header: t('probability'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 w-24">
          <Progress value={row.original.probability} className="h-1.5" />
          <span className="text-xs text-muted-foreground">{row.original.probability}%</span>
        </div>
      ),
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
      accessorKey: 'service',
      header: t('services'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.service}</span>
      ),
    },
    {
      accessorKey: 'expectedCloseDate',
      header: t('expectedCloseDate'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.expectedCloseDate ? formatDate(row.original.expectedCloseDate) : '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={opportunities}
      searchPlaceholder="Search opportunities..."
      onRowClick={(opp) => router.push(`/opportunities/${opp.id}`)}
    />
  )
}
