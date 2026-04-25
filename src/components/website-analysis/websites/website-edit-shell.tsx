'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { WebsiteForm } from './website-form'
import { WebsiteDeleteDialog } from './website-delete-dialog'
import type { CreateWebsiteInput } from '@/lib/validators/website-analysis'

interface Props {
  websiteId: string
  websiteName: string
  initial: Partial<CreateWebsiteInput>
}

export function WebsiteEditShell({ websiteId, websiteName, initial }: Props) {
  const [showDelete, setShowDelete] = useState(false)
  return (
    <div className="space-y-6">
      <WebsiteForm mode="edit" websiteId={websiteId} initial={initial} />
      <div className="mx-auto max-w-2xl border-t pt-4">
        <h2 className="mb-2 text-sm font-semibold text-red-600">Danger zone</h2>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Archive this website
        </Button>
      </div>
      <WebsiteDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        websiteId={websiteId}
        websiteName={websiteName}
      />
    </div>
  )
}
