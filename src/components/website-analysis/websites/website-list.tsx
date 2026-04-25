'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink } from 'lucide-react'
import { EmptyStateNoWebsite } from '@/components/website-analysis/shared/empty-state-no-website'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface IntegrationSummary {
  id: string
  provider: string
  status: string
  lastSyncAt: string | null
}

interface Website {
  id: string
  name: string
  domain: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  type: string
  createdAt: string
  integrations: IntegrationSummary[]
  _count: { integrations: number }
}

export function WebsiteList() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: Website[] }>({
    queryKey: ['websites'],
    queryFn: () => fetch('/api/website-analysis/websites').then((r) => r.json()),
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>
  if (isError || !data?.success) return <div className="p-8 text-sm text-red-600">Failed to load websites.</div>

  const websites = data.data
  const active = websites.filter((w) => w.status !== 'ARCHIVED')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Websites</h1>
          <p className="text-sm text-muted-foreground">Register and analyze your web properties in one place.</p>
        </div>
        <Link href="/website-analysis/websites/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />Add website
        </Link>
      </div>

      {active.length === 0 ? (
        <EmptyStateNoWebsite />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((w) => {
            const connected = w.integrations.filter((i) => i.status === 'CONNECTED').length
            return (
              <Link
                key={w.id}
                href={`/website-analysis/websites/${w.id}`}
                className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{w.name}</h3>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      {w.domain}
                    </p>
                  </div>
                  <Badge variant="outline">{w.type.replace('_', ' ')}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{connected} of {w.integrations.length || 7} sources connected</span>
                  <span>Added {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
