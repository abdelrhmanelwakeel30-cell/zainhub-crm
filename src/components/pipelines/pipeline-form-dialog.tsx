'use client'

import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  color: z.string().optional(),
  probability: z.coerce.number().int().min(0).max(100).default(0),
  isClosed: z.boolean().default(false),
  isWon: z.boolean().default(false),
})

const schema = z.object({
  name: z.string().min(1, 'Pipeline name is required'),
  nameAr: z.string().optional(),
  entityType: z.enum(['LEAD', 'OPPORTUNITY']),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  stages: z.array(stageSchema).min(1, 'At least one stage is required'),
})

type FormData = z.infer<typeof schema>
type FormInput = z.input<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_STAGES = [
  { name: 'New', color: '#6b7280', probability: 10, isClosed: false, isWon: false },
  { name: 'Qualified', color: '#3b82f6', probability: 30, isClosed: false, isWon: false },
  { name: 'Proposal', color: '#f59e0b', probability: 60, isClosed: false, isWon: false },
  { name: 'Won', color: '#10b981', probability: 100, isClosed: true, isWon: true },
  { name: 'Lost', color: '#ef4444', probability: 0, isClosed: true, isWon: false },
]

export function PipelineFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      entityType: 'OPPORTUNITY',
      isDefault: false,
      isActive: true,
      stages: DEFAULT_STAGES,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'stages' })

  const mutation = useMutation({
    mutationFn: (data: FormData) => fetch('/api/pipelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (r) => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed to create pipeline') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      toast.success('Pipeline created successfully')
      reset()
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Pipeline</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data as FormData))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Pipeline Name *</Label>
              <Input id="name" {...register('name')} className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="nameAr">Name (Arabic)</Label>
              <Input id="nameAr" dir="rtl" {...register('nameAr')} className="mt-1" />
            </div>

            <div>
              <Label>Entity Type *</Label>
              <Controller
                name="entityType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="OPPORTUNITY">Opportunity</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-center justify-between mt-6">
              <Label htmlFor="isDefault">Set as Default</Label>
              <Controller
                name="isDefault"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base">Stages</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', color: '#6b7280', probability: 0, isClosed: false, isWon: false })}
              >
                <Plus className="h-4 w-4 me-1" /> Add Stage
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-xs">Name</Label>
                  <Input {...register(`stages.${index}.name`)} className="mt-1" />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Probability %</Label>
                  <Input type="number" min={0} max={100} {...register(`stages.${index}.probability`)} className="mt-1" />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Color</Label>
                  <Input type="color" {...register(`stages.${index}.color`)} className="mt-1 h-9" />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            {errors.stages && <p className="text-xs text-red-500">{errors.stages.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
