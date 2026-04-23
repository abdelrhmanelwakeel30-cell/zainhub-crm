'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const companySchema = z.object({
  legalName: z.string().min(2, 'Legal name is required'),
  displayName: z.string().min(2, 'Display name is required'),
  industry: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  accountOwnerId: z.string().optional(),
  lifecycleStage: z.string().min(1),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<CompanyFormData>
  /** When provided the dialog PATCHes instead of POSTing */
  entityId?: string
}

export function CompanyFormDialog({ open, onOpenChange, defaultValues, entityId }: CompanyFormDialogProps) {
  const t = useTranslations('companies')
  const tc = useTranslations('common')
  const queryClient = useQueryClient()
  const isEditing = !!entityId

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: { lifecycleStage: 'LEAD', ...defaultValues },
  })

  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    enabled: open,
  })
  const users: { id: string; firstName: string; lastName: string }[] = usersResponse?.data ?? []

  const mutation = useMutation({
    mutationFn: (data: CompanyFormData) => {
      const url = isEditing ? `/api/companies/${entityId}` : '/api/companies'
      const method = isEditing ? 'PATCH' : 'POST'
      return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legalName: data.legalName,
          displayName: data.displayName,
          industry: data.industry || undefined,
          country: data.country || undefined,
          city: data.city || undefined,
          phone: data.phone || undefined,
          website: data.website || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          lifecycleStage: data.lifecycleStage || 'LEAD',
          accountOwnerId: data.accountOwnerId || undefined,
        }),
      }).then(async (r) => {
        if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed'); }
        return r.json();
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success(isEditing ? 'Company updated successfully' : 'Company created successfully')
      if (!isEditing) reset()
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || (isEditing ? 'Failed to update company' : 'Failed to create company'))
    },
  })

  const onSubmit = (data: CompanyFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editCompany') : t('newCompany')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('legalName')} *</Label>
              <Input {...register('legalName')} className="mt-1" />
              {errors.legalName && <p className="text-xs text-red-500 mt-1">{errors.legalName.message}</p>}
            </div>
            <div>
              <Label>{t('displayName')} *</Label>
              <Input {...register('displayName')} className="mt-1" />
              {errors.displayName && <p className="text-xs text-red-500 mt-1">{errors.displayName.message}</p>}
            </div>
            <div>
              <Label>{t('industry')}</Label>
              <Input {...register('industry')} className="mt-1" />
            </div>
            <div>
              <Label>{t('website')}</Label>
              <Input {...register('website')} className="mt-1" placeholder="https://" />
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
              <Label>Country</Label>
              <Input {...register('country')} className="mt-1" defaultValue="UAE" />
            </div>
            <div>
              <Label>City</Label>
              <Input {...register('city')} className="mt-1" defaultValue="Dubai" />
            </div>
            <div>
              <Label>{t('lifecycleStage')}</Label>
              <select {...register('lifecycleStage')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="LEAD">Lead</option>
                <option value="PROSPECT">Prospect</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PARTNER">Partner</option>
              </select>
            </div>
            <div>
              <Label>{t('accountOwner')}</Label>
              <select {...register('accountOwnerId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select owner...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Textarea {...register('address')} rows={2} className="mt-1" />
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
