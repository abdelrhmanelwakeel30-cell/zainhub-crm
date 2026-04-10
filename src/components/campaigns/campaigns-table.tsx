'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  status: string
  budget: number
  actualSpend: number
  platform: string | null
  leads: number
  startDate: string | null
  endDate: string | null
}

interface CampaignsApiResponse {
  success: boolean
  data: Campaign[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function CampaignsTable() {
  const router = useRouter()
  const t = useTranslations('campaigns')

  const { data: response } = useQuery<CampaignsApiResponse>({
    queryKey: ['campaigns'],
    queryFn: () => fetch('/api/campaigns').then(r => r.json()),
  })

  const campaigns = response?.data ?? []

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
          AED {(row.original.budget ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'actualSpend',
      header: t('actualSpend'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          AED {(row.original.actualSpend ?? 0).toLocaleString()}
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
      accessorKey: 'leads',
      header: t('leadsGenerated'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">{row.original.leads ?? 0}</span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: t('dates'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.startDate ? formatDate(row.original.startDate) : '-'} -{' '}
          {row.original.endDate ? formatDate(row.original.endDate) : '-'}
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
