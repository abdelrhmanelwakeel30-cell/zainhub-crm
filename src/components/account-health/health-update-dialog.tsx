'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  companyId: z.string().min(1, 'Company is required'),
})

type FormData = z.infer<typeof schema>

interface AccountHealth {
  companyId: string
  company?: { id: string; displayName: string }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  health: AccountHealth | null
  onSuccess?: () => void
}

export function HealthUpdateDialog({ open, onOpenChange, health, onSuccess }: Props) {
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    staleTime: 300_000,
  })

  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []

  const { handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { companyId: health?.companyId ?? '' },
  })

  useEffect(() => {
    if (open) {
      reset({ companyId: health?.companyId ?? '' })
    }
  }, [open, health, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/account-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: data.companyId }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to recalculate health')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-health'] })
      toast.success('Health score recalculated')
      reset()
      onSuccess?.()
    },
    onError: () => toast.error('Failed to recalculate health score'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {health ? `Recalculate: ${health.company?.displayName}` : 'Recalculate Account Health'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          {!health && (
            <div>
              <Label>Company *</Label>
              <Controller
                name="companyId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select company...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.displayName}</option>
                    ))}
                  </select>
                )}
              />
              {errors.companyId && (
                <p className="text-xs text-red-500 mt-1">{errors.companyId.message}</p>
              )}
            </div>
          )}

          {health && (
            <Controller
              name="companyId"
              control={control}
              defaultValue={health.companyId}
              render={({ field }) => <input type="hidden" {...field} />}
            />
          )}

          <p className="text-sm text-muted-foreground">
            This will recalculate the health score based on current active services, open tickets,
            overdue invoices, and delayed projects.
          </p>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Recalculate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
