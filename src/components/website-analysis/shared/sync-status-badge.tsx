import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

type Status = 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR' | 'EXPIRED' | 'SYNCING'

const STYLES: Record<Status, string> = {
  NOT_CONNECTED: 'bg-muted text-muted-foreground',
  CONNECTED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ERROR: 'bg-red-500/15 text-red-700 dark:text-red-400',
  EXPIRED: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SYNCING: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
}

const LABELS: Record<Status, string> = {
  NOT_CONNECTED: 'Not connected',
  CONNECTED: 'Connected',
  ERROR: 'Error',
  EXPIRED: 'Expired',
  SYNCING: 'Syncing…',
}

export function SyncStatusBadge({ status, lastSyncAt }: { status: Status; lastSyncAt?: string | Date | null }) {
  return (
    <div className="flex items-center gap-2">
      <Badge className={STYLES[status]}>{LABELS[status]}</Badge>
      {lastSyncAt && (
        <span className="text-xs text-muted-foreground">
          Last sync {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
        </span>
      )}
    </div>
  )
}
