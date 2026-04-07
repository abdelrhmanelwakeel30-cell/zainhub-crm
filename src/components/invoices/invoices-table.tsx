'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { invoices } from '@/lib/demo-data'

type Invoice = (typeof invoices)[number]

export function InvoicesTable() {
  const router = useRouter()
  const t = useTranslations('invoices')

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
      accessorKey: 'client.name',
      header: t('client'),
      cell: ({ row }) => (
        <p className="font-medium">{row.original.client.name}</p>
      ),
    },
    {
      accessorKey: 'project.name',
      header: t('project'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.project.name}</span>
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
          AED {row.original.totalAmount.toLocaleString()}
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
          AED {row.original.balanceDue.toLocaleString()}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={invoices}
      searchPlaceholder="Search invoices..."
      onRowClick={(inv) => router.push(`/invoices/${inv.id}`)}
    />
  )
}
