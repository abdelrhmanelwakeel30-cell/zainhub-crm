'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const subscriptionSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  serviceId: z.string().optional(),
  packageId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  currency: z.string().default('AED'),
  interval: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string().optional(),
  autoRenew: z.boolean().default(true),
})

type SubscriptionFormData = z.infer<typeof subscriptionSchema>

interface SubscriptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR']
const INTERVALS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual' },
  { value: 'ANNUAL', label: 'Annual' },
]

export function SubscriptionFormDialog({ open, onOpenChange }: SubscriptionFormDialogProps) {
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => fetch('/api/companies?pageSize=200').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch('/api/services?pageSize=200').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const companies: Array<{ id: string; displayName: string }> = companiesData?.data ?? []
  const services: Array<{ id: string; name: string }> = servicesData?.data ?? []

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      currency: 'AED',
      interval: 'MONTHLY',
      autoRenew: true,
    },
  })

  const selectedServiceId = watch('serviceId')

  const { data: packagesData } = useQuery({
    queryKey: ['service-packages', selectedServiceId],
    queryFn: () => fetch(`/api/services/${selectedServiceId}/packages?pageSize=50`).then(r => r.json()),
    enabled: !!selectedServiceId,
  })

  const packages: Array<{ id: string; name: string }> = packagesData?.data ?? []

  const mutation = useMutation({
    mutationFn: (data: SubscriptionFormData) =>
      fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Subscription created successfully')
      reset()
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to create subscription'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d as SubscriptionFormData))} className="space-y-4">
          <div>
            <Label>Company *</Label>
            <select {...register('companyId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
            </select>
            {errors.companyId && <p className="text-xs text-red-500 mt-1">{errors.companyId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Service</Label>
              <select {...register('serviceId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select service...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Package</Label>
              <select {...register('packageId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" disabled={!selectedServiceId}>
                <option value="">Select package...</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label>Subscription Name *</Label>
            <Input {...register('name')} className="mt-1" placeholder="e.g. Monthly SEO Retainer" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount *</Label>
              <Input {...register('amount')} type="number" step="0.01" className="mt-1" placeholder="0.00" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label>Currency</Label>
              <select {...register('currency')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Billing Interval *</Label>
              <select {...register('interval')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
              {errors.interval && <p className="text-xs text-red-500 mt-1">{errors.interval.message}</p>}
            </div>
            <div>
              <Label>Start Date *</Label>
              <Input {...register('startDate')} type="date" className="mt-1" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={3} className="mt-1" placeholder="Any additional notes..." />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoRenew" {...register('autoRenew')} className="rounded border-input" />
            <Label htmlFor="autoRenew">Auto Renew</Label>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
