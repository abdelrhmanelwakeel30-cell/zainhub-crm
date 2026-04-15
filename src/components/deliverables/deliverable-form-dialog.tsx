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
  name: z.string().min(1, 'Name is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  type: z.enum(['DESIGN', 'CODE', 'DOCUMENT', 'REPORT', 'ASSET', 'OTHER']),
  visibility: z.enum(['INTERNAL', 'CLIENT', 'PUBLIC']),
  projectId: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeliverableFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => fetch('/api/projects?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const projects: { id: string; name: string }[] = projectsData?.data ?? []

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'OTHER', visibility: 'INTERNAL' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          fileUrl: data.fileUrl,
          type: data.type,
          visibility: data.visibility,
          projectId: data.projectId || undefined,
          description: data.description || undefined,
        }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      toast.success('Deliverable added')
      reset()
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to add deliverable'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Deliverable</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input {...register('name')} placeholder="e.g. Brand Guidelines PDF" className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="col-span-2">
              <Label>File URL *</Label>
              <Input {...register('fileUrl')} placeholder="https://drive.google.com/..." className="mt-1" />
              {errors.fileUrl && <p className="text-xs text-red-500 mt-1">{errors.fileUrl.message}</p>}
            </div>

            <div>
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="DESIGN">Design</option>
                    <option value="CODE">Code</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="REPORT">Report</option>
                    <option value="ASSET">Asset</option>
                    <option value="OTHER">Other</option>
                  </select>
                )}
              />
            </div>

            <div>
              <Label>Visibility</Label>
              <Controller
                name="visibility"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="INTERNAL">Internal</option>
                    <option value="CLIENT">Client</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                )}
              />
            </div>

            <div className="col-span-2">
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

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} placeholder="Optional description..." className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Add Deliverable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
