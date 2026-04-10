'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  client: { displayName: string }
  issueDate: string
  dueDate: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  status: string
  currency: string
}

export function InvoicesTable() {
  const router = useRouter()
  const t = useTranslations('invoices')

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetch('/api/invoices').then(r => r.json()),
  })

  const invoices: Invoice[] = data?.data ?? []

  const columns: ColumnDef<Invoice, unknown>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.invoiceNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'client.displayName',
      header: t('client'),
      cell: ({ row }) => (
        <p className="font-medium">{row.original.client.displayName}</p>
      ),
    },
    {
      accessorKey: 'issueDate',
      header: t('issueDate'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.issueDate)}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: t('dueDate'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: t('totalAmount'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.currency} {row.original.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'balanceDue',
      header: t('balanceDue'),
      cell: ({ row }) => (
        <span className={`text-sm font-semibold ${row.original.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {row.original.currency} {row.original.balanceDue.toLocaleString()}
        </span>
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

  return (
    <DataTable
      columns={columns}
      data={invoices}
      searchPlaceholder="Search invoices..."
      onRowClick={(inv) => router.push(`/invoices/${inv.id}`)}
    />
  )
}
