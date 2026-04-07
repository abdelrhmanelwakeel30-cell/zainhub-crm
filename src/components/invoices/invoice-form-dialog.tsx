'use client'

import { useTranslations } from 'next-intl'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { companies, projects } from '@/lib/demo-data'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<InvoiceFormData>
}

export function InvoiceFormDialog({ open, onOpenChange, defaultValues }: InvoiceFormDialogProps) {
  const t = useTranslations('invoices')
  const tc = useTranslations('common')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: '', amount: '' }],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const selectedClientId = watch('clientId')
  const clientProjects = projects.filter(p => p.client.id === selectedClientId)

  const onSubmit = async (data: InvoiceFormData) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Invoice created successfully')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editInvoice') : t('newInvoice')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('client')} *</Label>
              <select {...register('clientId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select client...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>
            <div>
              <Label>{t('project')}</Label>
              <select {...register('projectId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select project...</option>
                {clientProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('issueDate')} *</Label>
              <Input {...register('issueDate')} type="date" className="mt-1" />
              {errors.issueDate && <p className="text-xs text-red-500 mt-1">{errors.issueDate.message}</p>}
            </div>
            <div>
              <Label>{t('dueDate')} *</Label>
              <Input {...register('dueDate')} type="date" className="mt-1" />
              {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t('lineItems')} *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => append({ description: '', amount: '' })}
              >
                <Plus className="h-3 w-3 me-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Description"
                      className="text-sm"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-red-500 mt-1">{errors.items[index].description?.message}</p>
                    )}
                  </div>
                  <div className="w-32">
                    <Input
                      {...register(`items.${index}.amount`)}
                      type="number"
                      placeholder="Amount"
                      className="text-sm"
                    />
                    {errors.items?.[index]?.amount && (
                      <p className="text-xs text-red-500 mt-1">{errors.items[index].amount?.message}</p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.items?.root && (
              <p className="text-xs text-red-500 mt-1">{errors.items.root.message}</p>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} rows={3} className="mt-1" />
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
