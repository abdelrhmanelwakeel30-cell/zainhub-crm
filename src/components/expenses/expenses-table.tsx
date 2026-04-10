'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Expense {
  id: string
  expenseNumber: string
  description: string
  amount: number
  currency: string
  category: { name: string }
  expenseDate: string
  status: string
  paidBy: { firstName: string; lastName: string }
  project: { id: string; name: string } | null
}

export function ExpensesTable() {
  const router = useRouter()
  const t = useTranslations('expenses')

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => fetch('/api/expenses').then(r => r.json()),
  })

  const expenses: Expense[] = data?.data ?? []

  const columns: ColumnDef<Expense, unknown>[] = [
    {
      accessorKey: 'expenseNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.expenseNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'description',
      header: t('vendor'),
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.description}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: t('category'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.category.name}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: t('amount'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          {row.original.currency} {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'expenseDate',
      header: t('expenseDate'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.expenseDate)}
        </span>
      ),
    },
    {
      accessorKey: 'project',
      header: t('project'),
      cell: ({ row }) => {
        const project = row.original.project
        if (!project) return <span className="text-xs text-muted-foreground">-</span>
        return (
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {project.name}
          </Link>
        )
      },
    },
    {
      accessorKey: 'status',
      header: t('status'),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'paidBy',
      header: t('createdBy'),
      cell: ({ row }) => {
        const paidBy = row.original.paidBy
        const fullName = `${paidBy.firstName} ${paidBy.lastName}`
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        )
      },
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
      data={expenses}
      searchPlaceholder="Search expenses..."
      onRowClick={(expense) => router.push(`/expenses/${expense.id}`)}
    />
  )
}
