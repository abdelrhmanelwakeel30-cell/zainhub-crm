'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Building2 } from 'lucide-react'

type Company = {
  id: string
  companyNumber: string
  displayName: string
  lifecycleStage: string
  industry: string | null
  country: string | null
  city: string | null
  healthScore?: number | null
  annualRevenue?: number | null
  accountOwner: { firstName: string; lastName: string } | null
  _count: { contacts: number; opportunities: number }
}

export function CompaniesTable() {
  const router = useRouter()
  const t = useTranslations('companies')

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => fetch('/api/companies').then(r => r.json()),
  })

  const companies: Company[] = data?.data ?? []

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
      cell: ({ row }) => <ScoreIndicator score={row.original.healthScore ?? 0} size="sm" />,
    },
    {
      accessorKey: 'country',
      header: 'Location',
      cell: ({ row }) => (
        <span className="text-sm">
          {[row.original.city, row.original.country].filter(Boolean).join(', ') || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'accountOwner',
      header: t('accountOwner'),
      cell: ({ row }) => {
        const owner = row.original.accountOwner
        if (!owner) return <span className="text-sm text-muted-foreground">-</span>
        const fullName = `${owner.firstName} ${owner.lastName}`
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: '_count.contacts',
      header: 'Contacts',
      cell: ({ row }) => <span className="text-sm">{row.original._count?.contacts ?? 0}</span>,
    },
    {
      accessorKey: '_count.opportunities',
      header: 'Deals',
      cell: ({ row }) => <span className="text-sm">{row.original._count?.opportunities ?? 0}</span>,
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
      isLoading={isLoading}
      onRowClick={(company) => router.push(`/companies/${company.id}`)}
    />
  )
}
