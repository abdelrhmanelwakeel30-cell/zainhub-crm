'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Per-section error boundary. Closes part of R-004 / Fix-016.
 * Falls back gracefully without taking down the dashboard shell.
 *
 * In production we hide error.message (R-005) and only show the digest;
 * the real stack is captured by Sentry (no-op when DSN unset).
 */
export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: 'section' },
      extra: { digest: error.digest },
    })
    console.error('[section error]', error)
  }, [error])

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
      <Button size="sm" onClick={reset} variant="outline">
        <RefreshCw className="h-4 w-4 me-2 rtl:rotate-180" />
        Try again
      </Button>
    </div>
  )
}
