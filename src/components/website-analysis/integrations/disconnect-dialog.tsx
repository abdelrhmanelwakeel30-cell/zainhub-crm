'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  websiteId: string
  provider: string
  providerLabel: string
}

export function DisconnectDialog({ open, onOpenChange, websiteId, provider, providerLabel }: Props) {
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)
  const m = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/website-analysis/websites/${websiteId}/integrations/${provider}/disconnect`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok || !j.success) throw new Error(j.error || 'Disconnect failed')
    },
    onMutate: () => setPending(true),
    onSettled: () => setPending(false),
    onSuccess: () => {
      toast.success(`${providerLabel} disconnected`)
      qc.invalidateQueries({ queryKey: ['integrations', websiteId] })
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {providerLabel}?</DialogTitle>
          <DialogDescription>
            Stored credentials and sync state will be cleared. You can reconnect at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="destructive" onClick={() => m.mutate()} disabled={pending}>
            {pending ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
