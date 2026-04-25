'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  providerLabel: string
}

export function ConnectStubDialog({ open, onOpenChange, providerLabel }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connecting {providerLabel} is coming next</DialogTitle>
          <DialogDescription>
            Phase 1 of the Website Analysis module ships the foundation: data model, website management,
            and the Integrations shell. Live OAuth and data sync for {providerLabel} lands in the next release.
            Your attempt has been recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
