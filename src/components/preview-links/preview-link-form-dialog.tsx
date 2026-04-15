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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.enum(['WEBSITE', 'SYSTEM', 'PROTOTYPE', 'STAGING', 'DEMO', 'DESIGN']),
  projectId: z.string().optional(),
  sharedWithCompanyId: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
  password: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PreviewLinkFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => fetch('/api/projects?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const projects: { id: string; name: string }[] = projectsData?.data ?? []
  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'STAGING' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/preview-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          url: data.url,
          type: data.type,
          projectId: data.projectId || undefined,
          sharedWithCompanyId: data.sharedWithCompanyId || undefined,
          expiresAt: data.expiresAt || undefined,
          notes: data.notes || undefined,
          password: data.password || undefined,
        }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-links'] })
      toast.success('Preview link created')
      reset()
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to create preview link'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Preview Link</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input {...register('title')} placeholder="e.g. Homepage v2 Staging" className="mt-1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="col-span-2">
              <Label>URL *</Label>
              <Input {...register('url')} placeholder="https://staging.example.com" className="mt-1" />
              {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url.message}</p>}
            </div>

            <div>
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="WEBSITE">Website</option>
                    <option value="SYSTEM">System</option>
                    <option value="PROTOTYPE">Prototype</option>
                    <option value="STAGING">Staging</option>
                    <option value="DEMO">Demo</option>
                    <option value="DESIGN">Design</option>
                  </select>
                )}
              />
            </div>

            <div>
              <Label>Expiry Date</Label>
              <Input type="date" {...register('expiresAt')} className="mt-1" />
            </div>

            <div>
              <Label>Project</Label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div>
              <Label>Share With Company</Label>
              <Controller
                name="sharedWithCompanyId"
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
            </div>

            <div>
              <Label>Password (optional)</Label>
              <Input {...register('password')} type="password" placeholder="Optional access password" className="mt-1" />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea {...register('notes')} rows={3} placeholder="Any additional notes..." className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
