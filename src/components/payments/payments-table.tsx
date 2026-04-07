'use client'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { payments } from '@/lib/demo-data'

type Payment = (typeof payments)[number]

export function PaymentsTable() {
  const columns: ColumnDef<Payment, unknown>[] = [
    { accessorKey: 'paymentNumber', header: '#', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.paymentNumber}</span>, size: 100 },
    { accessorKey: 'client', header: 'Client', cell: ({ row }) => <span className="text-sm font-medium">{row.original.client.name}</span> },
    { accessorKey: 'invoice', header: 'Invoice', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.invoice.invoiceNumber}</span> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="text-sm font-semibold">AED {row.original.amount.toLocaleString()}</span> },
    { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => <StatusBadge status={row.original.paymentMethod} /> },
    { accessorKey: 'paymentDate', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.paymentDate)}</span> },
    { accessorKey: 'reference', header: 'Reference', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.reference || '-'}</span> },
  ]

  return <DataTable columns={columns} data={payments} searchPlaceholder="Search payments..." />
}
