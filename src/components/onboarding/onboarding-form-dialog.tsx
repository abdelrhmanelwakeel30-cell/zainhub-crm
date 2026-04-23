'use client'

import { useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const itemSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  isRequired: z.boolean(),
})

const schema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  projectId: z.string().optional(),
  templateId: z.string().optional(),
  items: z.array(itemSchema).optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function OnboardingFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const [useTemplate, setUseTemplate] = useState(false)
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const { data: templatesData } = useQuery({
    queryKey: ['onboarding-templates'],
    queryFn: () => fetch('/api/onboarding-templates').then(r => r.json()),
    staleTime: 5 * 60_000,
    refetchOnMount: true,
    enabled: open && useTemplate,
  })

  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []
  const projects: { id: string; name: string; clientId?: string }[] = projectsData?.data ?? []
  const templates: { id: string; name: string }[] = templatesData?.data ?? []

  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyId: '',
      projectId: '',
      templateId: '',
      items: [{ title: '', description: '', isRequired: true }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const selectedCompanyId = watch('companyId')
  const filteredProjects = selectedCompanyId
    ? projects.filter(p => !p.clientId || p.clientId === selectedCompanyId)
    : projects

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Record<string, unknown> = {
        companyId: data.companyId,
        projectId: data.projectId || undefined,
      }

      if (useTemplate && data.templateId) {
        payload.templateId = data.templateId
      } else {
        payload.items = (data.items ?? []).filter(i => i.title.trim()).map((item, idx) => ({
          title: item.title.trim(),
          description: item.description?.trim() || undefined,
          isRequired: item.isRequired,
          order: idx,
        }))
      }

      return fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => {
        if (!r.ok) throw new Error('Failed to create onboarding')
        return r.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Onboarding created')
      reset()
      onSuccess?.()
    },
    onError: () => toast.error('Failed to create onboarding'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Client Onboarding</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          {/* Company */}
          <div>
            <Label>Company *</Label>
            <Controller
              name="companyId"
              control={control}
              render={({ field }) => (
                <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select company...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
                  ))}
                </select>
              )}
            />
            {errors.companyId && <p className="text-xs text-red-500 mt-1">{errors.companyId.message}</p>}
          </div>

          {/* Project (optional) */}
          <div>
            <Label>Project (optional)</Label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">No project</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            />
          </div>

          {/* Template or manual */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            <Checkbox
              id="useTemplate"
              checked={useTemplate}
              onCheckedChange={(v) => setUseTemplate(!!v)}
            />
            <label htmlFor="useTemplate" className="text-sm cursor-pointer">
              Use an onboarding template
            </label>
          </div>

          {useTemplate ? (
            <div>
              <Label>Template</Label>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              />
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No templates found.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Checklist Items</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => append({ title: '', description: '', isRequired: true })}
                >
                  <Plus className="h-3 w-3 me-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <div className="flex-1 space-y-1.5">
                      <Input
                        {...register(`items.${idx}.title`)}
                        placeholder="Item title *"
                        className="h-8 text-sm"
                      />
                      <Input
                        {...register(`items.${idx}.description`)}
                        placeholder="Description (optional)"
                        className="h-7 text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <Controller
                          name={`items.${idx}.isRequired`}
                          control={control}
                          render={({ field: f }) => (
                            <Checkbox
                              id={`req-${idx}`}
                              checked={f.value}
                              onCheckedChange={(v) => f.onChange(!!v)}
                            />
                          )}
                        />
                        <label htmlFor={`req-${idx}`} className="text-xs text-muted-foreground cursor-pointer">
                          Required
                        </label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                      onClick={() => remove(idx)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Onboarding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
