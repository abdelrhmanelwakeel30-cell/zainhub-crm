'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { getInitials, formatDate } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

type Opportunity = {
  id: string
  opportunityNumber: string
  title: string
  company?: { id: string; displayName: string } | null
  primaryContact?: { id: string; firstName: string; lastName: string } | null
  stage?: { id: string; name: string; color?: string | null } | null
  expectedValue: number
  weightedValue?: number | null
  probability: number
  expectedCloseDate?: string | null
  owner?: { id: string; firstName: string; lastName: string } | null
}

export function OpportunitiesTable() {
  const router = useRouter()
  const t = useTranslations('opportunities')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const res = await fetch('/api/opportunities')
      if (!res.ok) throw new Error('Failed to load opportunities')
      return res.json()
    },
  })

  const opportunities: Opportunity[] = data?.data ?? []

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
          <p className="text-xs text-muted-foreground">{row.original.company?.displayName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'stage',
      header: t('stage'),
      cell: ({ row }) => (
        row.original.stage ? <StatusBadge status={row.original.stage.name} /> : <span className="text-sm text-muted-foreground">-</span>
      ),
    },
    {
      accessorKey: 'expectedValue',
      header: t('value'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          AED {(row.original.expectedValue ?? 0).toLocaleString()}
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
      accessorKey: 'primaryContact',
      header: t('contact') ?? 'Contact',
      cell: ({ row }) => {
        const contact = row.original.primaryContact
        if (!contact) return <span className="text-sm text-muted-foreground">-</span>
        return (
          <span className="text-sm text-muted-foreground">
            {contact.firstName} {contact.lastName}
          </span>
        )
      },
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

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Unable to load opportunities. Please refresh the page or contact support if the issue persists.</span>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={opportunities}
      searchPlaceholder="Search opportunities..."
      isLoading={isLoading}
      onRowClick={(opp) => router.push(`/opportunities/${opp.id}`)}
    />
  )
}
