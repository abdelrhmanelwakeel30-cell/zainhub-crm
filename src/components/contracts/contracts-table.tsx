'use client'

import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { contracts } from '@/lib/demo-data'

type Contract = (typeof contracts)[number]

export function ContractsTable() {
  const router = useRouter()

  const columns: ColumnDef<Contract, unknown>[] = [
    { accessorKey: 'contractNumber', header: '#', cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.contractNumber}</span>, size: 100 },
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => (<div><p className="font-medium">{row.original.title}</p><p className="text-xs text-muted-foreground">{row.original.client.name}</p></div>) },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <StatusBadge status={row.original.type} /> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'value', header: 'Value', cell: ({ row }) => <span className="text-sm font-semibold">{row.original.value ? `AED ${row.original.value.toLocaleString()}` : '-'}</span> },
    { accessorKey: 'startDate', header: 'Start', cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.startDate)}</span> },
    { accessorKey: 'endDate', header: 'End', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.endDate ? formatDate(row.original.endDate) : 'Indefinite'}</span> },
  ]

  return <DataTable columns={columns} data={contracts} searchPlaceholder="Search contracts..." onRowClick={(c) => router.push(`/contracts/${c.id}`)} />
}
