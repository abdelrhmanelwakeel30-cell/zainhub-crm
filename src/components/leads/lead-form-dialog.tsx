'use client'

import { useTranslations } from 'next-intl'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const leadSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  sourceId: z.string().optional(),
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
  const queryClient = useQueryClient()

  const { data: sourcesData } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: () => fetch('/api/lead-sources').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch('/api/services').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      urgency: 'MEDIUM',
      ...defaultValues,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: LeadFormData) => fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (r) => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to create lead') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Lead created successfully')
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onSubmit = (data: LeadFormData) => mutation.mutate(data)

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
                      {(servicesData?.data ?? []).map((s: { id: string; name: string }) => (
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
                name="sourceId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder={`${tc('select')}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(sourcesData?.data ?? []).map((s: { id: string; name: string }) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                      {(usersData?.data ?? []).map((u: { id: string; firstName: string; lastName: string }) => (
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
