'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { companies } from '@/lib/demo-data'
import { Building2 } from 'lucide-react'

type Company = (typeof companies)[number]

export function CompaniesTable() {
  const router = useRouter()
  const t = useTranslations('companies')

  const columns: ColumnDef<Company, any>[] = [
    {
      accessorKey: 'companyNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.companyNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'displayName',
      header: t('displayName'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <Building2 className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{row.original.displayName}</p>
            <p className="text-xs text-muted-foreground">{row.original.industry}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'lifecycleStage',
      header: t('lifecycleStage'),
      cell: ({ row }) => <StatusBadge status={row.original.lifecycleStage} />,
    },
    {
      accessorKey: 'healthScore',
      header: t('healthScore'),
      cell: ({ row }) => <ScoreIndicator score={row.original.healthScore} size="sm" />,
    },
    {
      accessorKey: 'country',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.city}, {row.original.country}</span>
      ),
    },
    {
      accessorKey: 'accountOwner',
      header: t('accountOwner'),
      cell: ({ row }) => {
        const owner = row.original.accountOwner
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
      accessorKey: 'contactCount',
      header: 'Contacts',
      cell: ({ row }) => <span className="text-sm">{row.original.contactCount}</span>,
    },
    {
      accessorKey: 'dealCount',
      header: 'Deals',
      cell: ({ row }) => <span className="text-sm">{row.original.dealCount}</span>,
    },
    {
      accessorKey: 'annualRevenue',
      header: t('annualRevenue'),
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.annualRevenue
            ? `AED ${(row.original.annualRevenue / 1000000).toFixed(1)}M`
            : '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={companies}
      searchPlaceholder="Search companies..."
      onRowClick={(company) => router.push(`/companies/${company.id}`)}
    />
  )
}
