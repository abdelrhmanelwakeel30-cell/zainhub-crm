'use client'

import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { users } from '@/lib/demo-data'
import { Users, UserCheck, Plus } from 'lucide-react'

type User = (typeof users)[number]

// Extend users with status and lastLogin for admin view
const usersWithStatus = users.map((user, i) => ({
  ...user,
  status: i < 4 ? 'active' as const : 'inactive' as const,
  lastLogin: new Date(Date.now() - i * 86400000).toISOString(),
}))

type UserWithStatus = (typeof usersWithStatus)[number]

export function UsersContent() {
  const t = useTranslations('admin')

  const totalUsers = usersWithStatus.length
  const activeUsers = usersWithStatus.filter((u) => u.status === 'active').length

  const columns: ColumnDef<UserWithStatus, unknown>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.original.department}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="text-sm">{row.original.email}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'jobTitle',
      header: 'Job Title',
      cell: ({ row }) => <span className="text-sm">{row.original.jobTitle}</span>,
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Login',
      cell: ({ row }) => {
        const date = new Date(row.original.lastLogin)
        return (
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
            {date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('users')} description={`${totalUsers} users`}>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> Add User</Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          title={t('totalUsers')}
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title={t('activeUsers')}
          value={activeUsers}
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={usersWithStatus}
        searchPlaceholder="Search users..."
      />
    </div>
  )
}
