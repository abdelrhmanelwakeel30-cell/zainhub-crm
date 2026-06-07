'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, Webhook, Trash2, Loader2, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Endpoint = { id: string; url: string; events: string[]; isActive: boolean; lastStatus: number | null; createdAt: string }

export function WebhooksContent() {
  const t = useTranslations('webhooks')
  const queryClient = useQueryClient()
  const [show, setShow] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)

  const { data } = useQuery({ queryKey: ['webhooks', 'list'], queryFn: () => fetch('/api/webhooks').then((r) => r.json()) })
  const endpoints: Endpoint[] = data?.data ?? []
  const available: string[] = data?.availableEvents ?? ['lead.created', 'invoice.paid', 'purchase_order.approved', 'employee.created']

  const del = useMutation({
    mutationFn: (id: string) => fetch(`/api/webhooks/${id}`, { method: 'DELETE' }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webhooks'] }); toast.success(t('removed')) },
    onError: () => toast.error(t('removeFailed')),
  })

  const statusBadge = (s: number | null) => {
    if (s == null) return <span className="text-[11px] text-muted-foreground">{t('noDeliveries')}</span>
    const ok = s >= 200 && s < 300
    return <span className={`text-[11px] ${ok ? 'text-emerald-600' : 'text-red-600'}`}>{t('lastStatus', { status: s || t('failed') })}</span>
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={t('subtitle')}>
        <Button size="sm" onClick={() => setShow(true)}><Plus className="h-4 w-4 me-2" /> {t('addEndpoint')}</Button>
      </PageHeader>

      <div className="rounded-lg border bg-card divide-y">
        {endpoints.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t('empty')}</p>}
        {endpoints.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.url}</p>
                <p className="text-xs text-muted-foreground">{e.events.join(', ')} · {statusBadge(e.lastStatus)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label={t('delete')} className="h-8 w-8" disabled={del.isPending} onClick={() => del.mutate(e.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
          </div>
        ))}
      </div>

      <AddDialog open={show} onOpenChange={setShow} available={available} onSecret={setSecret} />

      <Dialog open={secret !== null} onOpenChange={(o) => !o && setSecret(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('secretTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{t('secretHint')}</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">{secret}</code>
              <Button variant="outline" size="icon" aria-label={t('copy')} onClick={() => { navigator.clipboard?.writeText(secret ?? ''); toast.success(t('copied')) }}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <DialogFooter><DialogClose render={<Button type="button" />}>{t('done')}</DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddDialog({ open, onOpenChange, available, onSecret }: { open: boolean; onOpenChange: (o: boolean) => void; available: string[]; onSecret: (s: string) => void }) {
  const t = useTranslations('webhooks')
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const toggle = (e: string) => setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))

  const create = useMutation({
    mutationFn: () => fetch('/api/webhooks', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url, events }) }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['webhooks'] }); onSecret(r.data?.secret ?? ''); setUrl(''); setEvents([]); onOpenChange(false) },
    onError: () => toast.error(t('createFailed')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('addTitle')}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label htmlFor="wh-url">{t('payloadUrl')}</Label><Input id="wh-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hooks/crm" /></div>
          <div className="space-y-1.5">
            <Label>{t('events')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {available.map((e) => (
                <label key={e} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={events.includes(e)} onChange={() => toggle(e)} />
                  <span className="font-mono text-xs">{e}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>{t('cancel')}</DialogClose>
          <Button disabled={!/^https?:\/\//.test(url) || events.length === 0 || create.isPending} onClick={() => create.mutate()}>
            {create.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} {t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
