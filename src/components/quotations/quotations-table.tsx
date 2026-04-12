'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

type Quotation = {
  id: string
  quotationNumber: string
  title: string
  client?: { displayName: string }
  totalAmount: number
  status: string
  issueDate: string
  validUntil?: string
  currency: string
}

export function QuotationsTable() {
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => fetch('/api/quotations').then(r => r.json()),
  })

  const quotations: Quotation[] = data?.data ?? []

  const columns: ColumnDef<Quotation, unknown>[] = [
    {
      accessorKey: 'quotationNumber',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.quotationNumber}</span>,
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
      cell: ({ row }) => (
        <span className="text-sm font-semibold">{row.original.currency} {row.original.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'issueDate',
      header: 'Issued',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.issueDate)}</span>,
    },
    {
      accessorKey: 'validUntil',
      header: 'Expiry Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.validUntil ? formatDate(row.original.validUntil) : '-'}</span>
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
    return <p className="text-sm text-red-500 py-8 text-center">Failed to load quotations.</p>
  }

  return (
    <DataTable
      columns={columns}
      data={quotations}
      searchPlaceholder="Search quotations..."
      onRowClick={(q) => router.push(`/quotations/${q.id}`)}
    />
  )
}
