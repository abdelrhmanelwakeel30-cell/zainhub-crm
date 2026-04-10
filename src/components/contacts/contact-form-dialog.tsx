'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string().optional(),
  decisionRole: z.string(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<ContactFormData>
}

export function ContactFormDialog({ open, onOpenChange, defaultValues }: ContactFormDialogProps) {
  const t = useTranslations('contacts')
  const tc = useTranslations('common')
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => fetch('/api/companies').then(r => r.json()),
    enabled: open,
  })

  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { decisionRole: 'OTHER', ...defaultValues },
  })

  const mutation = useMutation({
    mutationFn: (data: ContactFormData) =>
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          jobTitle: data.jobTitle,
          companyId: data.companyId,
          notes: data.department,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact created successfully')
      reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to create contact')
    },
  })

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editContact') : t('newContact')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('firstName')} *</Label>
              <Input {...register('firstName')} className="mt-1" />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label>{t('lastName')} *</Label>
              <Input {...register('lastName')} className="mt-1" />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <Label>Email</Label>
              <Input {...register('email')} type="email" className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...register('phone')} className="mt-1" />
            </div>
            <div>
              <Label>{t('jobTitle')}</Label>
              <Input {...register('jobTitle')} className="mt-1" />
            </div>
            <div>
              <Label>{t('department')}</Label>
              <Input {...register('department')} className="mt-1" />
            </div>
            <div>
              <Label>Company</Label>
              <select {...register('companyId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">No company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('decisionRole')}</Label>
              <select {...register('decisionRole')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="DECISION_MAKER">Decision Maker</option>
                <option value="INFLUENCER">Influencer</option>
                <option value="CHAMPION">Champion</option>
                <option value="USER">User</option>
                <option value="GATEKEEPER">Gatekeeper</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              {tc('cancel')}
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
