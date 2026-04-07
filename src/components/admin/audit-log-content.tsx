'use client'

import { useTranslations } from 'next-intl'
import { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: string
  entityType: string
  entityName: string
  changes: string
}

const now = Date.now()
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString()

const auditEntries: AuditEntry[] = [
  {
    id: '1',
    timestamp: hoursAgo(1),
    user: 'Abdelrhman Elwakeel',
    action: 'completed',
    entityType: 'Task',
    entityName: 'Follow up with TechVentures',
    changes: 'Status changed from "in progress" to "completed"',
  },
  {
    id: '2',
    timestamp: hoursAgo(2),
    user: 'Sarah Al-Rashid',
    action: 'new',
    entityType: 'Opportunity',
    entityName: 'Enterprise CRM Migration',
    changes: 'Created new opportunity worth AED 120,000',
  },
  {
    id: '3',
    timestamp: hoursAgo(4),
    user: 'Omar Hassan',
    action: 'qualified',
    entityType: 'Lead',
    entityName: 'Gulf Innovations LLC',
    changes: 'Stage changed from "contacted" to "qualified"',
  },
  {
    id: '4',
    timestamp: hoursAgo(5),
    user: 'Layla Mahmoud',
    action: 'sent',
    entityType: 'Invoice',
    entityName: 'INV-0012',
    changes: 'Invoice sent to client for AED 45,000',
  },
  {
    id: '5',
    timestamp: hoursAgo(22),
    user: 'Ahmed Noor',
    action: 'new',
    entityType: 'Contact',
    entityName: 'Khalid Bin Waleed',
    changes: 'Added new contact under Dubai Media Group',
  },
  {
    id: '6',
    timestamp: hoursAgo(24),
    user: 'Abdelrhman Elwakeel',
    action: 'approved',
    entityType: 'Proposal',
    entityName: 'AI Chatbot Implementation',
    changes: 'Proposal approved and sent to client',
  },
  {
    id: '7',
    timestamp: hoursAgo(26),
    user: 'Sarah Al-Rashid',
    action: 'won',
    entityType: 'Opportunity',
    entityName: 'WhatsApp Bot for Al Futtaim',
    changes: 'Deal closed at AED 85,000',
  },
  {
    id: '8',
    timestamp: hoursAgo(28),
    user: 'Omar Hassan',
    action: 'in progress',
    entityType: 'Project',
    entityName: 'ZainHub Website Redesign',
    changes: 'Status changed from "planning" to "in progress"',
  },
  {
    id: '9',
    timestamp: hoursAgo(45),
    user: 'Layla Mahmoud',
    action: 'paid',
    entityType: 'Invoice',
    entityName: 'INV-0009',
    changes: 'Payment received — AED 32,500 via bank transfer',
  },
  {
    id: '10',
    timestamp: hoursAgo(53),
    user: 'Abdelrhman Elwakeel',
    action: 'active',
    entityType: 'User',
    entityName: 'Ahmed Noor',
    changes: 'User role updated from "viewer" to "Sales Rep"',
  },
]

export function AuditLogContent() {
  const t = useTranslations('admin')

  const columns: ColumnDef<AuditEntry, unknown>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp)
        return (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {date.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' })}{' '}
            {date.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
              {getInitials(row.original.user)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{row.original.user}</span>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => <StatusBadge status={row.original.action} />,
    },
    {
      accessorKey: 'entityType',
      header: 'Entity Type',
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {row.original.entityType}
        </span>
      ),
    },
    {
      accessorKey: 'entityName',
      header: 'Entity',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.entityName}</span>,
    },
    {
      accessorKey: 'changes',
      header: 'Changes',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-xs truncate block">
          {row.original.changes}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('auditLog')} description="Track all system activity" />

      <DataTable
        columns={columns}
        data={auditEntries}
        searchPlaceholder="Search audit log..."
      />
    </div>
  )
}
