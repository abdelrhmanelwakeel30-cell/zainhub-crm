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
  companyId: z.string().optional(),
  ownerId: z.string().min(1, 'Owner is required'),
  issueDate: z.string().optional(),
  validUntil: z.string().optional(),
  subtotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  taxAmount: z.coerce.number().default(0),
  totalAmount: z.coerce.number().default(0),
  currency: z.enum(['AED', 'SAR', 'USD', 'EUR', 'GBP', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR']).default('AED'),
  terms: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type FormInput = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuotationFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'minimal'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: { currency: 'AED', subtotal: 0, discountAmount: 0, taxAmount: 0, totalAmount: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (r) => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to create quotation') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      toast.success('Quotation created successfully')
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Quotation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} className="mt-1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>Client</Label>
              <Controller
                name="companyId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select company..." /></SelectTrigger>
                    <SelectContent>
                      {(companiesData?.data ?? []).map((c: { id: string; displayName: string }) => (
                        <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>Owner *</Label>
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select owner..." /></SelectTrigger>
                    <SelectContent>
                      {(usersData?.data ?? []).map((u: { id: string; firstName: string; lastName: string }) => (
                        <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ownerId && <p className="text-xs text-red-500 mt-1">{errors.ownerId.message}</p>}
            </div>

            <div>
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input id="issueDate" type="date" {...register('issueDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input id="validUntil" type="date" {...register('validUntil')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input id="subtotal" type="number" step="0.01" {...register('subtotal')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="taxAmount">Tax Amount</Label>
              <Input id="taxAmount" type="number" step="0.01" {...register('taxAmount')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="discountAmount">Discount</Label>
              <Input id="discountAmount" type="number" step="0.01" {...register('discountAmount')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input id="totalAmount" type="number" step="0.01" {...register('totalAmount')} className="mt-1" />
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
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} className="mt-1" />
            </div>

            <div className="col-span-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
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
