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
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const opportunitySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  clientId: z.string().optional(),
  contactId: z.string().optional(),
  stageId: z.string().optional(),
  expectedValue: z.string().min(1, 'Value is required'),
  probability: z.string(),
  expectedCloseDate: z.string().optional(),
  description: z.string().optional(),
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
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => fetch('/api/companies').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => fetch('/api/contacts').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: pipelinesData } = useQuery({
    queryKey: ['pipelines', 'OPPORTUNITY'],
    queryFn: () => fetch('/api/pipelines?type=OPPORTUNITY').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []
  const contacts: { id: string; firstName: string; lastName: string }[] = contactsData?.data ?? []

  // Flatten all stages from all pipelines
  const stages: { id: string; name: string }[] = (pipelinesData?.data ?? []).flatMap(
    (p: { stages?: { id: string; name: string }[] }) => p.stages ?? []
  )

  const { register, handleSubmit, formState: { errors }, reset } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: { probability: '50', ...defaultValues },
  })

  const mutation = useMutation({
    mutationFn: (data: OpportunityFormData) =>
      fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.name,
          companyId: data.clientId || undefined,
          primaryContactId: data.contactId || undefined,
          stageId: data.stageId || undefined,
          expectedValue: parseFloat(data.expectedValue),
          probability: parseInt(data.probability, 10),
          expectedCloseDate: data.expectedCloseDate || undefined,
          description: data.description || undefined,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Opportunity created successfully')
      reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to create opportunity')
    },
  })

  const onSubmit = (data: OpportunityFormData) => {
    mutation.mutate(data)
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
              <Input {...register('name')} className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>{t('company')}</Label>
              <select {...register('clientId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
              <Input {...register('expectedValue')} type="number" className="mt-1" placeholder="25000" />
              {errors.expectedValue && <p className="text-xs text-red-500 mt-1">{errors.expectedValue.message}</p>}
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
              <Label>{t('stage')}</Label>
              <select {...register('stageId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select stage...</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} className="mt-1" />
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
