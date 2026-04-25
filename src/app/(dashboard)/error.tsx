'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            An error occurred while loading this page.
          </p>
          {/* R-005 (CRM-V3-FULL-AUDIT-2026-04-25.md): only show error.message in
              development. In production, Prisma/Zod messages can leak schema
              details and table names. The digest is safe to show — it's a hash. */}
          {process.env.NODE_ENV !== 'production' && error.message && (
            <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-2 rounded-md">
              {error.message}
            </p>
          )}
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Reference: <code className="font-mono">{error.digest}</code>
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard'}>
            <Home className="h-4 w-4 me-2" />
            Dashboard
          </Button>
          <Button size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4 me-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
