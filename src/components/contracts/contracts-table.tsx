'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface Contract {
  id: string
  contractNumber: string
  title: string
  client: { displayName: string }
  type: string
  status: string
  startDate: string
  endDate: string | null
  totalValue: number | null
  currency: string
}

export function ContractsTable() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => fetch('/api/contracts').then(r => r.json()),
  })

  const contracts: Contract[] = data?.data ?? []

  const columns: ColumnDef<Contract, unknown>[] = [
    {
      accessorKey: 'contractNumber',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.contractNumber}</span>,
      size: 100,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.client.displayName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.type} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'totalValue',
      header: 'Value',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.totalValue ? `${row.original.currency} ${row.original.totalValue.toLocaleString()}` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.startDate)}</span>,
    },
    {
      accessorKey: 'endDate',
      header: 'End',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.endDate ? formatDate(row.original.endDate) : 'Indefinite'}</span>,
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

  return (
    <DataTable
      columns={columns}
      data={contracts}
      searchPlaceholder="Search contracts..."
      onRowClick={(c) => router.push(`/contracts/${c.id}`)}
    />
  )
}
