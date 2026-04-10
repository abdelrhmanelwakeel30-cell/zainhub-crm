'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface AuditUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName?: string
  sourceModule?: string
  ipAddress?: string
  createdAt: string
  user?: AuditUser
  changes?: Record<string, { old: unknown; new: unknown }>
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  APPROVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

function getActionColor(action: string) {
  return ACTION_COLORS[action] ?? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
}

const ACTION_OPTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'REJECT',
  'CONVERT',
  'ASSIGN',
  'ARCHIVE',
  'RESTORE',
]

interface Filters {
  action: string
  entityType: string
  dateFrom: string
  dateTo: string
  page: number
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams()
  params.set('page', String(filters.page))
  params.set('pageSize', '50')
  if (filters.action) params.set('action', filters.action)
  if (filters.entityType) params.set('entityType', filters.entityType)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  return params.toString()
}

function JsonDiff({ changes }: { changes: Record<string, { old: unknown; new: unknown }> }) {
  return (
    <div className="space-y-2">
      {Object.entries(changes).map(([field, diff]) => (
        <div key={field} className="rounded border bg-muted/30 p-2 text-xs">
          <p className="font-semibold text-foreground mb-1">{field}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground text-[10px] uppercase tracking-wide">Before</span>
              <pre className="mt-0.5 whitespace-pre-wrap break-all text-red-600 dark:text-red-400">
                {diff.old === null || diff.old === undefined
                  ? '—'
                  : typeof diff.old === 'object'
                    ? JSON.stringify(diff.old, null, 2)
                    : String(diff.old)}
              </pre>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] uppercase tracking-wide">After</span>
              <pre className="mt-0.5 whitespace-pre-wrap break-all text-green-600 dark:text-green-400">
                {diff.new === null || diff.new === undefined
                  ? '—'
                  : typeof diff.new === 'object'
                    ? JSON.stringify(diff.new, null, 2)
                    : String(diff.new)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailModal({
  entry,
  open,
  onClose,
}: {
  entry: AuditLogEntry | null
  open: boolean
  onClose: () => void
}) {
  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Audit Log Detail —{' '}
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getActionColor(entry.action)}`}>
              {entry.action}
            </span>{' '}
            {entry.entityType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Timestamp</p>
              <p className="font-medium">{format(new Date(entry.createdAt), 'PPpp')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Actor</p>
              <p className="font-medium">
                {entry.user
                  ? `${entry.user.firstName} ${entry.user.lastName} (${entry.user.email})`
                  : 'System'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Entity</p>
              <p className="font-medium">
                {entry.entityType}: {entry.entityName || entry.entityId}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Source Module</p>
              <p className="font-medium">{entry.sourceModule || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">IP Address</p>
              <p className="font-medium">{entry.ipAddress || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Entity ID</p>
              <p className="font-mono text-xs">{entry.entityId}</p>
            </div>
          </div>

          {entry.changes && Object.keys(entry.changes).length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Field Changes</p>
              <JsonDiff changes={entry.changes} />
            </div>
          )}

          {entry.beforeValue && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Before Snapshot</p>
              <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(entry.beforeValue, null, 2)}
              </pre>
            </div>
          )}

          {entry.afterValue && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">After Snapshot</p>
              <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(entry.afterValue, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AuditLogContent() {
  const t = useTranslations('admin')
  const [filters, setFilters] = useState<Filters>({
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
  })
  const [detailEntry, setDetailEntry] = useState<AuditLogEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () =>
      fetch(`/api/admin/audit-log?${buildQuery(filters)}`).then((r) => r.json()),
  })

  const logs: AuditLogEntry[] = data?.data ?? []

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.createdAt), 'dd MMM yy HH:mm')}
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Actor',
      cell: ({ row }) => {
        const u = row.original.user
        if (!u) return <span className="text-xs text-muted-foreground">System</span>
        return (
          <div className="text-xs">
            <p className="font-medium">{u.firstName} {u.lastName}</p>
            <p className="text-muted-foreground">{u.email}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${getActionColor(row.original.action)}`}
        >
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: 'entityType',
      header: 'Entity Type',
      cell: ({ row }) => (
        <span className="text-xs font-mono">{row.original.entityType}</span>
      ),
    },
    {
      id: 'entity',
      header: 'Entity Name / ID',
      cell: ({ row }) => (
        <div className="text-xs">
          {row.original.entityName ? (
            <>
              <p className="font-medium">{row.original.entityName}</p>
              <p className="text-muted-foreground font-mono">{row.original.entityId.slice(0, 12)}…</p>
            </>
          ) : (
            <p className="font-mono">{row.original.entityId.slice(0, 16)}…</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sourceModule',
      header: 'Source',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.sourceModule || '—'}</span>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground">{row.original.ipAddress || '—'}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDetailEntry(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  function handleFilterChange(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('auditLog')} description="Full system activity trail — every action, every user" />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Action</Label>
              <Select
                value={filters.action || 'ALL'}
                onValueChange={(v) => handleFilterChange('action', !v || v === 'ALL' ? '' : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All actions</SelectItem>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Entity Type</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Lead, Invoice…"
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          showSearch={false}
          pageSize={50}
          emptyMessage="No audit log entries found."
        />
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {data.page} of {data.totalPages} ({data.total} entries)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={filters.page >= data.totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <DetailModal
        entry={detailEntry}
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
      />
    </div>
  )
}
