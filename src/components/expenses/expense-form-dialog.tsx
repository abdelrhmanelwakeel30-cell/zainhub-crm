'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { expenseCategories, projects } from '@/lib/demo-data'
import { Loader2, Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const expenseSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  expenseDate: z.string().min(1, 'Date is required'),
  paymentMethod: z.string().optional(),
  description: z.string().optional(),
  projectId: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<ExpenseFormData>
}

export function ExpenseFormDialog({ open, onOpenChange, defaultValues }: ExpenseFormDialogProps) {
  const t = useTranslations('expenses')
  const tc = useTranslations('common')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { paymentMethod: 'CREDIT_CARD', ...defaultValues },
  })

  const onSubmit = async (data: ExpenseFormData) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Expense created successfully')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editExpense') : t('newExpense')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>{t('vendor')} *</Label>
              <Input {...register('vendorName')} className="mt-1" placeholder="e.g. Vercel, OpenAI..." />
              {errors.vendorName && <p className="text-xs text-red-500 mt-1">{errors.vendorName.message}</p>}
            </div>
            <div>
              <Label>{t('category')} *</Label>
              <select {...register('categoryId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select category...</option>
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <Label>{t('amount')} (AED) *</Label>
              <Input {...register('amount')} type="number" className="mt-1" placeholder="0.00" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label>{t('expenseDate')} *</Label>
              <Input {...register('expenseDate')} type="date" className="mt-1" />
              {errors.expenseDate && <p className="text-xs text-red-500 mt-1">{errors.expenseDate.message}</p>}
            </div>
            <div>
              <Label>{t('paymentMethod')}</Label>
              <select {...register('paymentMethod')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="PETTY_CASH">Petty Cash</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>{t('project')}</Label>
              <select {...register('projectId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">No project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <Label>{t('description')}</Label>
              <Textarea {...register('description')} rows={3} className="mt-1" placeholder="Describe the expense..." />
            </div>
            <div className="col-span-2">
              <Label>{t('receipt')}</Label>
              <div className="mt-1 flex items-center justify-center rounded-md border border-dashed border-input p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Click to upload receipt</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>
            </div>
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
