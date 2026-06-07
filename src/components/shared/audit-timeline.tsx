'use client'

import { useQuery } from '@tanstack/react-query'
import { formatRelativeDate } from '@/lib/utils'
import { History } from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  entityName: string | null
  createdAt: string
  user: { id: string; firstName: string; lastName: string } | null
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ARCHIVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ASSIGN: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  APPROVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

/**
 * Reusable per-record audit timeline (C-7). Drop onto any detail page:
 *   <AuditTimeline entityType="lead" entityId={lead.id} />
 */
export function AuditTimeline({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-trail', entityType, entityId],
    queryFn: () =>
      fetch(`/api/audit-trail?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`).then(
        (r) => r.json(),
      ),
    enabled: !!entityId,
  })
  const entries: AuditEntry[] = data?.data ?? []

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">History</h3>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No history yet.</p>
      ) : (
        <ol className="relative space-y-3 ps-4 before:absolute before:start-1 before:top-1 before:bottom-1 before:w-px before:bg-border">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -start-[13px] top-1 h-2 w-2 rounded-full bg-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${ACTION_COLOR[e.action] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {e.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.user ? `${e.user.firstName} ${e.user.lastName}` : 'System'} · {formatRelativeDate(e.createdAt)}
                </span>
              </div>
              {e.entityName && <p className="mt-0.5 text-xs text-foreground/80">{e.entityName}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
