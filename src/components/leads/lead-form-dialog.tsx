'use client'

import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { leadSources, users, services } from '@/lib/demo-data'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const leadSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assignedToId: z.string().optional(),
  interestedServiceId: z.string().optional(),
  budgetRange: z.string().optional(),
  notes: z.string().optional(),
})

type LeadFormData = z.infer<typeof leadSchema>

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<LeadFormData>
}

export function LeadFormDialog({ open, onOpenChange, defaultValues }: LeadFormDialogProps) {
  const t = useTranslations('leads')
  const tc = useTranslations('common')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      urgency: 'MEDIUM',
      ...defaultValues,
    },
  })

  const onSubmit = async (data: LeadFormData) => {
    setSaving(true)
    // Simulate save
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Lead created successfully')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editLead') : t('newLead')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="fullName">{t('fullName')} *</Label>
              <Input id="fullName" {...register('fullName')} className="mt-1" />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">{tc('email')}</Label>
              <Input id="email" type="email" {...register('email')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="phone">{tc('phone')}</Label>
              <Input id="phone" {...register('phone')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="companyName">{t('companyName')}</Label>
              <Input id="companyName" {...register('companyName')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="budgetRange">{t('budget')}</Label>
              <Input id="budgetRange" {...register('budgetRange')} placeholder="e.g. 10,000-20,000 AED" className="mt-1" />
            </div>

            <div>
              <Label>{t('interestedService')}</Label>
              <Controller
                name="interestedServiceId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder={`${tc('select')}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>{t('source')}</Label>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder={`${tc('select')}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {leadSources.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>{t('urgency')}</Label>
              <Controller
                name="urgency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>{t('assignedTo')}</Label>
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">{tc('notes')}</Label>
              <Textarea id="notes" {...register('notes')} rows={3} className="mt-1" />
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
