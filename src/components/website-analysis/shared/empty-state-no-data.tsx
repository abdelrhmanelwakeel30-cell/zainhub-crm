import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title?: string
  description?: string
  primaryAction?: { href: string; label: string }
}

export function EmptyStateNoData({
  title = 'No data yet',
  description = 'Connect a data source to start seeing analytics for this website.',
  primaryAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
      <BarChart3 className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">{description}</p>
      {primaryAction && (
        <Link href={primaryAction.href} className={cn(buttonVariants())}>
          {primaryAction.label}
        </Link>
      )}
    </div>
  )
}
