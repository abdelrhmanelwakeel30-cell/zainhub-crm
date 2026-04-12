'use client'

import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'

interface Payment {
  id: string
  paymentNumber: string
  amount: number
  currency: string
  paymentMethod: string
  paymentDate: string
  invoice: {
    invoiceNumber: string
    client: { displayName: string }
  } | null
  createdBy: { firstName: string; lastName: string } | null
}

interface PaymentsApiResponse {
  success: boolean
  data: Payment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function PaymentsTable() {
  const { data: response } = useQuery<PaymentsApiResponse>({
    queryKey: ['payments'],
    queryFn: () => fetch('/api/payments').then(r => r.json()),
  })

  const payments = response?.data ?? []

  const columns: ColumnDef<Payment, unknown>[] = [
    {
      accessorKey: 'paymentNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.paymentNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'invoice',
      header: 'Client',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.invoice?.client?.displayName ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.invoice?.invoiceNumber ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">AED {(row.original.amount ?? 0).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Method',
      cell: ({ row }) => <StatusBadge status={row.original.paymentMethod} />,
    },
    {
      accessorKey: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.paymentDate)}</span>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'Recorded By',
      cell: ({ row }) => {
        const rb = row.original.createdBy
        return (
          <span className="text-xs text-muted-foreground">
            {rb ? `${rb.firstName} ${rb.lastName}` : '-'}
          </span>
        )
      },
    },
  ]

  return <DataTable columns={columns} data={payments} searchPlaceholder="Search payments..." />
}
