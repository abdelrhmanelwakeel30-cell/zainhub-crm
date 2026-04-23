'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatRelativeDate } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: string
  priority: string
  type: string
  client?: { displayName: string } | null
  assignedTo?: { firstName: string; lastName: string } | null
  createdAt: string
  dueDate?: string | null
}

export function TicketsTable() {
  const router = useRouter()
  const t = useTranslations('tickets')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets')
      if (!res.ok) throw new Error('Failed to load tickets')
      return res.json()
    },
  })

  const tickets: Ticket[] = data?.data ?? []

  const columns: ColumnDef<Ticket, unknown>[] = [
    {
      accessorKey: 'ticketNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.ticketNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'subject',
      header: t('subject'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.subject}</p>
          {row.original.client && (
            <p className="text-xs text-muted-foreground">{row.original.client.displayName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('type'),
      cell: ({ row }) => <StatusBadge status={row.original.type.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'priority',
      header: t('priority'),
      cell: ({ row }) => <StatusBadge status={row.original.priority.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'assignedTo',
      header: t('assignedTo'),
      cell: ({ row }) => {
        const user = row.original.assignedTo
        if (!user) return <span className="text-xs text-muted-foreground italic">Unassigned</span>
        const fullName = `${user.firstName} ${user.lastName}`
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status.replace(/_/g, ' ')} />,
    },
    {
      accessorKey: 'createdAt',
      header: t('createdAt'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatRelativeDate(row.original.createdAt)}</span>
      ),
    },
  ]

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Unable to load tickets. Please refresh the page or contact support if the issue persists.</span>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={tickets}
      isLoading={isLoading}
      searchPlaceholder={`${t('title')}...`}
      onRowClick={(ticket) => router.push(`/tickets/${ticket.id}`)}
    />
  )
}
