'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodFormResolver } from '@/lib/forms/zod-resolver'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['EMAIL', 'SOCIAL', 'ADS', 'EVENT', 'REFERRAL', 'CONTENT_MARKETING', 'OTHER']),
  platform: z.string().optional(),
  budget: z.coerce.number().optional(),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).default('AED'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
})

type FormData = z.infer<typeof schema>
type FormInput = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CampaignFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormInput>({
    resolver: zodFormResolver(schema),
    defaultValues: { type: 'OTHER', status: 'DRAFT', currency: 'AED' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (r) => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to create campaign') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Campaign created successfully')
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
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
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SOCIAL">Social Media</SelectItem>
                      <SelectItem value="ADS">Paid Ads</SelectItem>
                      <SelectItem value="EVENT">Event</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="CONTENT_MARKETING">Content Marketing</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="platform">Platform</Label>
              <Input id="platform" {...register('platform')} placeholder="Meta, Google, LinkedIn..." className="mt-1" />
            </div>

            <div>
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" type="number" step="0.01" {...register('budget')} className="mt-1" />
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

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} className="mt-1" />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} className="mt-1" />
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
