'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { buttonVariants } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared section-level error boundary.
 *
 * Closes R-004a (High) from CRM-V3-PRODUCTION-AUDIT-2026-04-25.md.
 * Replaces the per-route error.tsx duplicates with a single component
 * that consistently captures to Sentry and renders the same UI.
 */
export function SectionError({
  error,
  reset,
  boundary,
}: {
  error: Error & { digest?: string }
  reset: () => void
  /** A label for the boundary, used as a Sentry tag (e.g. 'leads', 'invoices'). */
  boundary: string
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary },
      extra: { digest: error.digest },
    })
  }, [error, boundary])

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          We hit an error rendering this page. The team has been notified.
        </p>
        {process.env.NODE_ENV !== 'production' && error.message && (
          <pre className="mt-3 text-xs font-mono bg-muted px-3 py-2 rounded-md max-w-2xl overflow-auto text-left">
            {error.message}
          </pre>
        )}
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Reference: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        type="button"
      >
        <RefreshCw className="h-4 w-4 me-2 rtl:rotate-180" />
        Try again
      </button>
    </div>
  )
}
