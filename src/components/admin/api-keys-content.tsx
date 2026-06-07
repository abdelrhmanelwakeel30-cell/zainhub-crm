'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, KeyRound, Trash2, Loader2, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatRelativeDate } from '@/lib/utils'

type ApiKey = { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; revokedAt: string | null; createdAt: string; user?: { firstName: string; lastName: string } | null }

export function ApiKeysContent() {
  const t = useTranslations('apiKeys')
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)

  const { data } = useQuery({ queryKey: ['api-keys', 'list'], queryFn: () => fetch('/api/api-keys').then((r) => r.json()) })
  const keys: ApiKey[] = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: () => fetch('/api/api-keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['api-keys'] }); setNewKey(r.data?.key ?? null); setName('') },
    onError: () => toast.error(t('createFailed')),
  })
  const revokeMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/api-keys/${id}`, { method: 'DELETE' }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['api-keys'] }); toast.success(t('revokeSuccess')) },
    onError: () => toast.error(t('revokeFailed')),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={t('subtitle')}>
        <div className="flex items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('keyNamePlaceholder')} className="h-9 w-44" />
          <Button size="sm" disabled={!name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 me-2" />} {t('create')}
          </Button>
        </div>
      </PageHeader>

      <div className="rounded-lg border bg-card divide-y">
        {keys.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t('empty')}</p>}
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{k.name} {k.revokedAt && <span className="text-[11px] text-red-600">{t('revoked')}</span>}</p>
                <p className="text-xs text-muted-foreground font-mono">{k.keyPrefix}… · {k.lastUsedAt ? t('usedAgo', { when: formatRelativeDate(k.lastUsedAt) }) : t('neverUsed')}</p>
              </div>
            </div>
            {!k.revokedAt && (
              <Button variant="ghost" size="icon" aria-label={t('revoke')} className="h-8 w-8" disabled={revokeMutation.isPending} onClick={() => revokeMutation.mutate(k.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={newKey !== null} onOpenChange={(o) => !o && setNewKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('createdTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{t('copyOnce')}</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">{newKey}</code>
              <Button variant="outline" size="icon" aria-label={t('copy')} onClick={() => { navigator.clipboard?.writeText(newKey ?? ''); toast.success(t('copied')) }}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('sendAs')}</p>
          </div>
          <DialogFooter><DialogClose render={<Button type="button" />}>{t('done')}</DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
