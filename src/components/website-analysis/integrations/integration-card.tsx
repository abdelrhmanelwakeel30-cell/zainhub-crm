'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ProviderLogo } from '@/components/website-analysis/shared/provider-logo'
import { SyncStatusBadge } from '@/components/website-analysis/shared/sync-status-badge'
import { ConnectStubDialog } from './connect-stub-dialog'
import { DisconnectDialog } from './disconnect-dialog'
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

export function IntegrationCard({ row, websiteId }: { row: IntegrationRow; websiteId: string }) {
  const [showStub, setShowStub] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const connectAttempt = useMutation({
    mutationFn: async () => {
      // Fire audit-logged stub call, then show explanatory dialog
      await fetch(`/api/website-analysis/websites/${websiteId}/integrations/${row.provider}/connect`, { method: 'POST' })
    },
    onSuccess: () => setShowStub(true),
    onError: () => setShowStub(true),
  })

  const connected = row.integration.status === 'CONNECTED'

  return (
    <div className="flex flex-col rounded-lg border bg-card p-5">
      <div className="flex items-start gap-3">
        <ProviderLogo provider={row.provider} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{row.meta.label}</h3>
          <p className="text-xs text-muted-foreground">{row.meta.description}</p>
        </div>
      </div>

      <div className="my-4">
        <SyncStatusBadge status={row.integration.status} lastSyncAt={row.integration.lastSyncAt} />
      </div>

      <div className="mt-auto flex gap-2">
        {connected ? (
          <Button variant="outline" size="sm" onClick={() => setShowDisconnect(true)}>Disconnect</Button>
        ) : (
          <Button size="sm" onClick={() => connectAttempt.mutate()} disabled={connectAttempt.isPending}>
            Connect
          </Button>
        )}
      </div>

      <ConnectStubDialog open={showStub} onOpenChange={setShowStub} providerLabel={row.meta.label} />
      <DisconnectDialog
        open={showDisconnect}
        onOpenChange={setShowDisconnect}
        websiteId={websiteId}
        provider={row.provider}
        providerLabel={row.meta.label}
      />
    </div>
  )
}
