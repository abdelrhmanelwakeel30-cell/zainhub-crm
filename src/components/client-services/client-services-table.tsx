'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface ClientService {
  id: string
  clientServiceNumber: string
  serviceName: string
  status: string
  environment: string
  monthlyValue: number | null
  currency: string
  startDate: string | null
  company: { id: string; displayName: string } | null
  assignedTo: { id: string; firstName: string; lastName: string } | null
  _count: { milestones: number; changeRequests: number }
}

export function ClientServicesTable() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['client-services'],
    queryFn: () => fetch('/api/client-services').then(r => r.json()),
  })

  const services: ClientService[] = data?.data ?? []

  const columns: ColumnDef<ClientService, unknown>[] = [
    {
      accessorKey: 'clientServiceNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.clientServiceNumber}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'serviceName',
      header: 'Service',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.serviceName}</p>
          {row.original.company && (
            <p className="text-xs text-muted-foreground">{row.original.company.displayName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 130,
    },
    {
      accessorKey: 'environment',
      header: 'Env',
      cell: ({ row }) => <StatusBadge status={row.original.environment} />,
      size: 110,
    },
    {
      accessorKey: 'assignedTo',
      header: 'Assigned To',
      cell: ({ row }) =>
        row.original.assignedTo ? (
          <span className="text-sm">
            {row.original.assignedTo.firstName} {row.original.assignedTo.lastName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.startDate ? formatDate(row.original.startDate) : '-'}
        </span>
      ),
      size: 110,
    },
    {
      accessorKey: 'monthlyValue',
      header: 'MRR',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.monthlyValue
            ? `${row.original.currency} ${row.original.monthlyValue.toLocaleString()}`
            : '-'}
        </span>
      ),
      size: 130,
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
      data={services}
      searchPlaceholder="Search services..."
      onRowClick={(s) => router.push(`/client-services/${s.id}`)}
    />
  )
}
