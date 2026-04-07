'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'
import { expenses } from '@/lib/demo-data'
import Link from 'next/link'

type Expense = (typeof expenses)[number]

export function ExpensesTable() {
  const router = useRouter()
  const t = useTranslations('expenses')

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
      accessorKey: 'vendorName',
      header: t('vendor'),
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.vendorName}</span>
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
      accessorKey: 'totalAmount',
      header: t('amount'),
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          AED {row.original.totalAmount.toLocaleString()}
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
      accessorKey: 'createdBy',
      header: t('createdBy'),
      cell: ({ row }) => {
        const creator = row.original.createdBy
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{creator.name}</span>
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={expenses}
      searchPlaceholder="Search expenses..."
      onRowClick={(expense) => router.push(`/expenses/${expense.id}`)}
    />
  )
}
