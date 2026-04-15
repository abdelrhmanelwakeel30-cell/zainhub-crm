'use client'

import { useForm, Controller } from 'react-hook-form'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['SERVICE', 'RETAINER', 'NDA', 'PARTNERSHIP', 'MAINTENANCE', 'OTHER']).default('SERVICE'),
  clientId: z.string().min(1, 'Client is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  autoRenew: z.boolean().default(false),
  value: z.coerce.number().optional(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).default('AED'),
  scopeSummary: z.string().optional(),
  terms: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type FormInput = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'minimal'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: { type: 'SERVICE', currency: 'AED', autoRenew: false },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (r) => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to create contract') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Contract created successfully')
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Contract</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} className="mt-1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Service Agreement</SelectItem>
                      <SelectItem value="RETAINER">Retainer</SelectItem>
                      <SelectItem value="NDA">NDA</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>Client *</Label>
              <Controller
                name="clientId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select client..." /></SelectTrigger>
                    <SelectContent>
                      {(companiesData?.data ?? []).map((c: { id: string; displayName: string }) => (
                        <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>

            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} className="mt-1" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="renewalDate">Renewal Date</Label>
              <Input id="renewalDate" type="date" {...register('renewalDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="value">Contract Value</Label>
              <Input id="value" type="number" step="0.01" {...register('value')} className="mt-1" />
            </div>

            <div>
              <Label>Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="scopeSummary">Scope Summary</Label>
              <Textarea id="scopeSummary" {...register('scopeSummary')} rows={3} className="mt-1" />
            </div>

            <div className="col-span-2">
              <Label htmlFor="terms">Terms</Label>
              <Textarea id="terms" {...register('terms')} rows={3} className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
