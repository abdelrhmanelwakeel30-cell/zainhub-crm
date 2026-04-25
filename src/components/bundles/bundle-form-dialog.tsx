'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const bundleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0).optional().or(z.literal('')),
  currency: z.string().default('AED'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})

type BundleFormData = z.infer<typeof bundleSchema>

interface BundleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundle?: {
    id: string
    name: string
    description: string | null
    category: string | null
    price: number | null
    currency: string
    isActive: boolean
    sortOrder: number
  }
}

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR']

export function BundleFormDialog({ open, onOpenChange, bundle }: BundleFormDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!bundle

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: bundle?.name ?? '',
      description: bundle?.description ?? '',
      category: bundle?.category ?? '',
      price: bundle?.price ?? undefined,
      currency: bundle?.currency ?? 'AED',
      isActive: bundle?.isActive ?? true,
      sortOrder: bundle?.sortOrder ?? 0,
    },
  })

  useEffect(() => {
    if (open && bundle) {
      reset({
        name: bundle.name,
        description: bundle.description ?? '',
        category: bundle.category ?? '',
        price: bundle.price ?? undefined,
        currency: bundle.currency,
        isActive: bundle.isActive,
        sortOrder: bundle.sortOrder,
      })
    }
  }, [open, bundle, reset])

  const mutation = useMutation({
    mutationFn: (data: BundleFormData) => {
      const body = { ...data, price: data.price === '' ? null : data.price }
      if (isEditing) {
        return fetch(`/api/bundles/${bundle!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      }
      return fetch('/api/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      toast.success(isEditing ? 'Bundle updated' : 'Bundle created')
      reset()
      onOpenChange(false)
    },
     
    onError: () => toast.error(isEditing ? 'Failed to update bundle' : 'Failed to create bundle'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Bundle' : 'New Service Bundle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d as BundleFormData))} className="space-y-4">
          <div>
            <Label>Bundle Name *</Label>
            <Input {...register('name')} className="mt-1" placeholder="e.g. Full Agency Package" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} rows={2} className="mt-1" placeholder="Brief description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input {...register('category')} className="mt-1" placeholder="e.g. AI Automation" />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input {...register('sortOrder')} type="number" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price</Label>
              <Input {...register('price')} type="number" step="0.01" className="mt-1" placeholder="Leave blank for custom" />
            </div>
            <div>
              <Label>Currency</Label>
              <select {...register('currency')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register('isActive')} className="rounded border-input" />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Bundle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
