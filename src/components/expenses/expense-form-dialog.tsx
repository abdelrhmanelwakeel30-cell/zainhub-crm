'use client'

import { useTranslations } from 'next-intl'
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
import { Loader2, Upload } from 'lucide-react'
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
  const queryClient = useQueryClient()

  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'minimal'],
    queryFn: () => fetch('/api/projects?minimal=true').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })
  const projects = projectsResponse?.data ?? []

  const { data: categoriesResponse } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => fetch('/api/expense-categories').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })
  const expenseCategories: { id: string; name: string }[] = categoriesResponse?.data ?? []

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { paymentMethod: 'CREDIT_CARD', ...defaultValues },
  })

  const mutation = useMutation({
    mutationFn: (data: ExpenseFormData) => {
      const amountNum = parseFloat(data.amount)
      return fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorName: data.vendorName,
          categoryId: data.categoryId,
          amount: amountNum,
          totalAmount: amountNum,
          expenseDate: data.expenseDate,
          paymentMethod: data.paymentMethod,
          description: data.description,
          linkedProjectId: data.projectId || undefined,
        }),
      }).then(async (r) => {
        if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
        return r.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Expense created successfully')
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const onSubmit = (data: ExpenseFormData) => mutation.mutate(data)

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
                <option value="CHECK">Check</option>
                <option value="ONLINE">Online</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>{t('project')}</Label>
              <select {...register('projectId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">No project</option>
                {projects.map((p: { id: string; name: string }) => (
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
