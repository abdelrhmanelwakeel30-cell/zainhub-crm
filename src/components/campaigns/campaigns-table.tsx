'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { campaigns } from '@/lib/demo-data'

type Campaign = (typeof campaigns)[number]

export function CampaignsTable() {
  const router = useRouter()
  const t = useTranslations('campaigns')

  const columns: ColumnDef<Campaign, unknown>[] = [
    {
      accessorKey: 'name',
      header: t('name'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.description}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('type'),
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'budget',
      header: t('budget'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          AED {row.original.budget.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'actualSpend',
      header: t('actualSpend'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          AED {row.original.actualSpend.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'platform',
      header: t('platform'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.platform || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'leadsGenerated',
      header: t('leadsGenerated'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">{row.original.leadsGenerated}</span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: t('dates'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.startDate)} - {row.original.endDate ? formatDate(row.original.endDate) : '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={campaigns}
      searchPlaceholder="Search campaigns..."
      onRowClick={(campaign) => router.push(`/campaigns/${campaign.id}`)}
    />
  )
}
