'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, formatDate } from '@/lib/utils'
import { contacts } from '@/lib/demo-data'

type Contact = (typeof contacts)[number]

export function ContactsTable() {
  const router = useRouter()
  const t = useTranslations('contacts')

  const columns: ColumnDef<Contact, unknown>[] = [
    {
      accessorKey: 'contactNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.contactNumber}</span>
      ),
      size: 100,
    },
    {
      accessorKey: 'firstName',
      header: t('firstName'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
              {getInitials(`${row.original.firstName} ${row.original.lastName}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.firstName} {row.original.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'jobTitle',
      header: t('jobTitle'),
      cell: ({ row }) => <span className="text-sm">{row.original.jobTitle}</span>,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.company?.name || '-'}</span>
      ),
    },
    {
      accessorKey: 'decisionRole',
      header: t('decisionRole'),
      cell: ({ row }) => <StatusBadge status={row.original.decisionRole.replace('_', ' ')} />,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-sm">{row.original.phone}</span>,
    },
    {
      accessorKey: 'leadScore',
      header: t('leadScore'),
      cell: ({ row }) => <ScoreIndicator score={row.original.leadScore} size="sm" />,
    },
    {
      accessorKey: 'lastContactedAt',
      header: t('lastContacted'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastContactedAt ? formatDate(row.original.lastContactedAt) : '-'}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={contacts}
      searchPlaceholder="Search contacts..."
      onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
    />
  )
}
