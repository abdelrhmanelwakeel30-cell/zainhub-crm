'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWebsiteSchema, WEBSITE_TYPES, type CreateWebsiteInput } from '@/lib/validators/website-analysis'

interface Props {
  mode: 'create' | 'edit'
  websiteId?: string
  initial?: Partial<CreateWebsiteInput>
}

export function WebsiteForm({ mode, websiteId, initial }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const form = useForm({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      name: initial?.name ?? '',
      domain: initial?.domain ?? '',
      brand: initial?.brand ?? '',
      type: (initial?.type ?? 'CORPORATE') as 'CORPORATE' | 'ECOMMERCE' | 'LANDING_PAGE' | 'PORTFOLIO' | 'BLOG' | 'SAAS' | 'CAMPAIGN_PAGE' | 'OTHER',
      primaryMarket: initial?.primaryMarket ?? '',
      primaryLanguage: initial?.primaryLanguage ?? '',
      notes: initial?.notes ?? '',
      ownerUserId: initial?.ownerUserId ?? '',
    },
  } as any)

  const submit = useMutation({
    mutationFn: async (values: CreateWebsiteInput) => {
      const url = mode === 'create'
        ? '/api/website-analysis/websites'
        : `/api/website-analysis/websites/${websiteId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) })
      const json = await r.json()
      if (!r.ok || !json.success) throw new Error(typeof json.error === 'string' ? json.error : 'Save failed')
      return json.data as { id: string }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['websites'] })
      if (mode === 'create') {
        toast.success('Website added')
        router.push(`/website-analysis/websites/${data.id}/integrations`)
      } else {
        toast.success('Website updated')
        router.push(`/website-analysis/websites/${websiteId}/overview`)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <form onSubmit={form.handleSubmit((v) => submit.mutate(v as CreateWebsiteInput))} className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{mode === 'create' ? 'Add website' : 'Edit website'}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...form.register('name')} />
          {form.formState.errors.name && <p className="mt-1 text-xs text-red-600">{typeof form.formState.errors.name.message === 'string' ? form.formState.errors.name.message : 'Invalid name'}</p>}
        </div>
        <div>
          <Label htmlFor="domain">Domain *</Label>
          <Input id="domain" {...form.register('domain')} placeholder="example.com" />
          {form.formState.errors.domain && <p className="mt-1 text-xs text-red-600">{typeof form.formState.errors.domain.message === 'string' ? form.formState.errors.domain.message : 'Invalid domain'}</p>}
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...form.register('brand')} />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={form.watch('type') || 'CORPORATE'} onValueChange={(v) => form.setValue('type', v as any)}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEBSITE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="primaryMarket">Primary market</Label>
          <Input id="primaryMarket" {...form.register('primaryMarket')} placeholder="AE, SA, Global…" />
        </div>
        <div>
          <Label htmlFor="primaryLanguage">Primary language</Label>
          <Input id="primaryLanguage" {...form.register('primaryLanguage')} placeholder="en, ar…" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register('notes')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Saving…' : mode === 'create' ? 'Add website' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
