'use client'

import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { proposals } from '@/lib/demo-data'

type Proposal = (typeof proposals)[number]

export function ProposalsTable() {
  const router = useRouter()

  const columns: ColumnDef<Proposal, unknown>[] = [
    { accessorKey: 'proposalNumber', header: '#', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.proposalNumber}</span>, size: 100 },
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => (<div><p className="font-medium">{row.original.title}</p><p className="text-xs text-muted-foreground">{row.original.company?.name}</p></div>) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'totalAmount', header: 'Amount', cell: ({ row }) => <span className="text-sm font-semibold">AED {row.original.totalAmount.toLocaleString()}</span> },
    { accessorKey: 'issueDate', header: 'Issued', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.issueDate)}</span> },
    { accessorKey: 'validUntil', header: 'Valid Until', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.validUntil ? formatDate(row.original.validUntil) : '-'}</span> },
  ]

  return <DataTable columns={columns} data={proposals} searchPlaceholder="Search proposals..." onRowClick={(p) => router.push(`/proposals/${p.id}`)} />
}
