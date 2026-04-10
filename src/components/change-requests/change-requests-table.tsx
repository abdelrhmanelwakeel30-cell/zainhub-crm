'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatRelativeDate } from '@/lib/utils'

interface ChangeRequest {
  id: string
  crNumber: string
  title: string
  status: string
  priority: string
  type: string
  company?: { displayName: string } | null
  requestedBy?: { firstName: string; lastName: string } | null
  estimatedCost?: number | null
  currency?: string
  dueDate?: string | null
  _count?: { comments: number }
}

export function ChangeRequestsTable() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['change-requests'],
    queryFn: () => fetch('/api/change-requests').then(r => r.json()),
  })

  const changeRequests: ChangeRequest[] = data?.data ?? []

  const columns: ColumnDef<ChangeRequest, unknown>[] = [
    {
      accessorKey: 'crNumber',
      header: 'CR #',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.crNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.company && (
            <p className="text-xs text-muted-foreground">{row.original.company.displayName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => row.original.company
        ? <span className="text-sm">{row.original.company.displayName}</span>
        : <span className="text-xs text-muted-foreground italic">—</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <StatusBadge status={row.original.type.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => <StatusBadge status={row.original.priority} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'estimatedCost',
      header: 'Est. Cost',
      cell: ({ row }) => {
        const cost = row.original.estimatedCost
        const currency = row.original.currency ?? 'AED'
        if (!cost) return <span className="text-xs text-muted-foreground">—</span>
        return (
          <span className="text-sm font-medium">
            {currency} {cost.toLocaleString()}
          </span>
        )
      },
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => row.original.dueDate
        ? <span className="text-xs text-muted-foreground">{formatRelativeDate(row.original.dueDate)}</span>
        : <span className="text-xs text-muted-foreground">—</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={changeRequests}
      isLoading={isLoading}
      searchPlaceholder="Search change requests..."
      onRowClick={(cr) => router.push(`/change-requests/${cr.id}`)}
    />
  )
}
