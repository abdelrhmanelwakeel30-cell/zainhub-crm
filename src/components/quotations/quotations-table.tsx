'use client'

import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'
import { quotations } from '@/lib/demo-data'

type Quotation = (typeof quotations)[number]

export function QuotationsTable() {
  const router = useRouter()

  const columns: ColumnDef<Quotation, unknown>[] = [
    { accessorKey: 'quotationNumber', header: '#', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.quotationNumber}</span>, size: 100 },
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => (<div><p className="font-medium">{row.original.title}</p><p className="text-xs text-muted-foreground">{row.original.company?.name}</p></div>) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'totalAmount', header: 'Amount', cell: ({ row }) => <span className="text-sm font-semibold">AED {row.original.totalAmount.toLocaleString()}</span> },
    { accessorKey: 'owner', header: 'Owner', cell: ({ row }) => (<div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{getInitials(row.original.owner.name)}</AvatarFallback></Avatar><span className="text-sm">{row.original.owner.name}</span></div>) },
    { accessorKey: 'issueDate', header: 'Issued', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.issueDate)}</span> },
    { accessorKey: 'validUntil', header: 'Valid Until', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.validUntil ? formatDate(row.original.validUntil) : '-'}</span> },
  ]

  return <DataTable columns={columns} data={quotations} searchPlaceholder="Search quotations..." onRowClick={(q) => router.push(`/quotations/${q.id}`)} />
}
