'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, ShieldAlert, Loader2, Copy } from 'lucide-react'

type Status = { enabled: boolean; available: boolean }

export function SecuritySection() {
  const t = useTranslations('admin')
  const queryClient = useQueryClient()
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null)
  const [code, setCode] = useState('')

  const { data } = useQuery({
    queryKey: ['admin', '2fa'],
    queryFn: () => fetch('/api/auth/2fa').then((r) => r.json()),
  })
  const status: Status = data?.data ?? { enabled: false, available: true }

  const enroll = useMutation({
    mutationFn: () => fetch('/api/auth/2fa/enroll', { method: 'POST' }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: (r) => { setSecret(r.data?.secret ?? null); setOtpauthUri(r.data?.otpauthUri ?? null) },
    onError: () => toast.error(t('twoFAEnrollFailed')),
  })

  const verify = useMutation({
    mutationFn: () => fetch('/api/auth/2fa/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: code }) }).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || 'failed'); return j }),
    onSuccess: () => {
      setSecret(null); setOtpauthUri(null); setCode('')
      queryClient.invalidateQueries({ queryKey: ['admin', '2fa'] })
      toast.success(t('twoFAEnabled'))
    },
    onError: () => toast.error(t('twoFAInvalidCode')),
  })

  const disable = useMutation({
    mutationFn: () => fetch('/api/auth/2fa/disable', { method: 'POST' }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', '2fa'] }); toast.success(t('twoFADisabled')) },
    onError: () => toast.error(t('settingsSaveFailed')),
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${status.enabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400'}`}>
            {status.enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle>{t('security')}</CardTitle>
            <CardDescription>{t('twoFADesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.available && (
          <p className="text-sm text-amber-600">{t('twoFAUnavailable')}</p>
        )}

        {status.available && status.enabled && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-600 font-medium">{t('twoFAActive')}</p>
            <Button variant="outline" size="sm" onClick={() => disable.mutate()} disabled={disable.isPending}>
              {disable.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}{t('twoFADisable')}
            </Button>
          </div>
        )}

        {status.available && !status.enabled && !secret && (
          <Button size="sm" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
            {enroll.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}{t('twoFAEnable')}
          </Button>
        )}

        {status.available && !status.enabled && secret && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('twoFAScanSecret')}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs font-mono tracking-widest">{secret}</code>
                <Button variant="outline" size="icon" aria-label={t('copy')} onClick={() => { navigator.clipboard?.writeText(otpauthUri ?? secret); toast.success(t('copied')) }}><Copy className="h-4 w-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('twoFAUriHint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totp-code">{t('twoFAEnterCode')}</Label>
              <div className="flex items-center gap-2">
                <Input id="totp-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="w-32 font-mono tracking-widest" />
                <Button size="sm" onClick={() => verify.mutate()} disabled={code.length !== 6 || verify.isPending}>
                  {verify.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}{t('twoFAConfirm')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
