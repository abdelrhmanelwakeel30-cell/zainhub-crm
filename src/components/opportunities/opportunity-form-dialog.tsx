'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { companies, contacts, services, users } from '@/lib/demo-data'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const opportunitySchema = z.object({
  title: z.string().min(2, 'Title is required'),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  value: z.string().min(1, 'Value is required'),
  probability: z.string(),
  expectedCloseDate: z.string().optional(),
  serviceId: z.string().optional(),
  ownerId: z.string().optional(),
  notes: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<OpportunityFormData>
}

export function OpportunityFormDialog({ open, onOpenChange, defaultValues }: OpportunityFormDialogProps) {
  const t = useTranslations('opportunities')
  const tc = useTranslations('common')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: { probability: '50', ...defaultValues },
  })

  const onSubmit = async (data: OpportunityFormData) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Opportunity created successfully')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editOpportunity') : t('newOpportunity')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>{t('dealName')} *</Label>
              <Input {...register('title')} className="mt-1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label>{t('company')}</Label>
              <select {...register('companyId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select company...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('contact')}</Label>
              <select {...register('contactId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select contact...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('value')} (AED) *</Label>
              <Input {...register('value')} type="number" className="mt-1" placeholder="25000" />
              {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value.message}</p>}
            </div>
            <div>
              <Label>{t('probability')} (%)</Label>
              <Input {...register('probability')} type="number" min="0" max="100" className="mt-1" />
            </div>
            <div>
              <Label>{t('expectedCloseDate')}</Label>
              <Input {...register('expectedCloseDate')} type="date" className="mt-1" />
            </div>
            <div>
              <Label>{t('services')}</Label>
              <select {...register('serviceId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>{t('owner')}</Label>
              <select {...register('ownerId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select owner...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea {...register('notes')} rows={3} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tc('cancel')}
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
