'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  websiteId: string
  websiteName: string
}

export function WebsiteDeleteDialog({ open, onOpenChange, websiteId, websiteName }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)
  const m = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/website-analysis/websites/${websiteId}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok || !j.success) throw new Error(j.error || 'Delete failed')
    },
    onMutate: () => setPending(true),
    onSettled: () => setPending(false),
    onSuccess: () => {
      toast.success(`"${websiteName}" archived`)
      qc.invalidateQueries({ queryKey: ['websites'] })
      onOpenChange(false)
      router.push('/website-analysis/websites')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive &ldquo;{websiteName}&rdquo;?</DialogTitle>
          <DialogDescription>
            The website will be hidden from the active list. Its historical data is preserved and it can be restored later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="destructive" onClick={() => m.mutate()} disabled={pending}>
            {pending ? 'Archiving…' : 'Archive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
