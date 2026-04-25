'use client'

import { useQuery } from '@tanstack/react-query'
import { IntegrationCard } from './integration-card'
import type { IntegrationProvider } from '@/lib/validators/website-analysis'
import type { ProviderMeta } from '@/lib/website-analysis/providers'

interface IntegrationRow {
  provider: IntegrationProvider
  meta: ProviderMeta
  integration: {
    id: string | null
    status: 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR' | 'EXPIRED' | 'SYNCING'
    lastSyncAt: string | null
    externalAccountLabel: string | null
  }
}

export function IntegrationList({ websiteId }: { websiteId: string }) {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: IntegrationRow[] }>({
    queryKey: ['integrations', websiteId],
    queryFn: () => fetch(`/api/website-analysis/websites/${websiteId}/integrations`).then((r) => r.json()),
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading integrations…</div>
  if (isError || !data?.success) return <div className="p-8 text-sm text-red-600">Failed to load integrations.</div>

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Data sources</h2>
        <p className="text-sm text-muted-foreground">
          Connect analytics, SEO, and behavior tools to power this website&apos;s dashboards.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.data.map((row) => (
          <IntegrationCard key={row.provider} row={row} websiteId={websiteId} />
        ))}
      </div>
    </div>
  )
}
