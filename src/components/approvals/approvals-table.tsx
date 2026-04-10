'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ApprovalRequest {
  id: string
  entityType: string
  entityTitle: string | null
  status: string
  currentStep: number
  totalSteps: number
  dueDate: string | null
  requestedBy: { id: string; firstName: string; lastName: string } | null
}

export function ApprovalsTable() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => fetch('/api/approvals').then((r) => r.json()),
  })

  const requests: ApprovalRequest[] = data?.data ?? []

  const columns: ColumnDef<ApprovalRequest, unknown>[] = [
    {
      accessorKey: 'entityType',
      header: 'Entity Type',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.entityType.replace(/_/g, ' ').toLowerCase()}
        />
      ),
      size: 160,
    },
    {
      accessorKey: 'entityTitle',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.entityTitle || <span className="text-muted-foreground italic">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'requestedBy',
      header: 'Requested By',
      cell: ({ row }) => {
        const user = row.original.requestedBy
        if (!user) return <span className="text-xs text-muted-foreground italic">—</span>
        return (
          <span className="text-sm">
            {user.firstName} {user.lastName}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status.replace(/_/g, ' ').toLowerCase()} />
      ),
      size: 130,
    },
    {
      id: 'progress',
      header: 'Step',
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.original.currentStep} / {row.original.totalSteps}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const due = row.original.dueDate
        if (!due) return <span className="text-xs text-muted-foreground italic">—</span>
        const isOverdue =
          new Date(due) < new Date() &&
          row.original.status !== 'APPROVED' &&
          row.original.status !== 'REJECTED' &&
          row.original.status !== 'WITHDRAWN'
        return (
          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {formatDate(due)}
          </span>
        )
      },
      size: 120,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/approvals/${row.original.id}`)
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      size: 60,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={requests}
      isLoading={isLoading}
      searchPlaceholder="Search approvals..."
      onRowClick={(req) => router.push(`/approvals/${req.id}`)}
    />
  )
}
