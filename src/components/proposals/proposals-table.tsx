'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

type Proposal = {
  id: string
  proposalNumber: string
  title: string
  client?: { displayName: string }
  totalAmount: number
  status: string
  createdAt: string
  expiryDate?: string
}

export function ProposalsTable() {
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => fetch('/api/proposals').then(r => r.json()),
  })

  const proposals: Proposal[] = data?.data ?? []

  const columns: ColumnDef<Proposal, unknown>[] = [
    {
      accessorKey: 'proposalNumber',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.proposalNumber}</span>,
      size: 100,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">{row.original.client?.displayName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Amount',
      cell: ({ row }) => <span className="text-sm font-semibold">AED {row.original.totalAmount.toLocaleString()}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'expiryDate',
      header: 'Expiry Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.expiryDate ? formatDate(row.original.expiryDate) : '-'}</span>
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
    return <p className="text-sm text-red-500 py-8 text-center">Failed to load proposals.</p>
  }

  return (
    <DataTable
      columns={columns}
      data={proposals}
      searchPlaceholder="Search proposals..."
      onRowClick={(p) => router.push(`/proposals/${p.id}`)}
    />
  )
}
