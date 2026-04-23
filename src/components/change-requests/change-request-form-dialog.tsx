'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ChangeRequestFormData {
  title: string
  type: string
  priority: string
  companyId: string
  projectId: string
  description: string
  impactDescription: string
  estimatedHours: string
  estimatedCost: string
  dueDate: string
}

interface Company {
  id: string
  displayName: string
}

interface Project {
  id: string
  name: string
  clientId?: string | null
}

interface ChangeRequestFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ChangeRequestFormDialog({ open, onOpenChange, onSuccess }: ChangeRequestFormDialogProps) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, control, reset, watch } = useForm<ChangeRequestFormData>({
    defaultValues: {
      title: '',
      type: 'OTHER',
      priority: 'MEDIUM',
      companyId: '',
      projectId: '',
      description: '',
      impactDescription: '',
      estimatedHours: '',
      estimatedCost: '',
      dueDate: '',
    },
  })

  const selectedCompanyId = watch('companyId')

  const { data: companiesResponse } = useQuery({
    queryKey: ['companies', 'minimal'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })
  const companies: Company[] = companiesResponse?.data ?? []

  const { data: projectsResponse } = useQuery({
    queryKey: ['projects', 'minimal'],
    queryFn: () => fetch('/api/projects?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })
  const allProjects: Project[] = projectsResponse?.data ?? []

  const filteredProjects = selectedCompanyId
    ? allProjects.filter((p) => p.clientId === selectedCompanyId)
    : allProjects

  const mutation = useMutation({
    mutationFn: (data: ChangeRequestFormData) =>
      fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          type: data.type || undefined,
          priority: data.priority || undefined,
          companyId: data.companyId || undefined,
          projectId: data.projectId || undefined,
          description: data.description || undefined,
          impactDescription: data.impactDescription || undefined,
          estimatedHours: data.estimatedHours ? parseFloat(data.estimatedHours) : undefined,
          estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined,
          dueDate: data.dueDate || undefined,
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const e = await r.json()
          throw new Error(e.error || 'Failed to create change request')
        }
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] })
      toast.success('Change request created successfully')
      reset()
      onSuccess?.()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Change Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input {...register('title', { required: true })} placeholder="Brief title for this change request..." />
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCOPE">Scope</SelectItem>
                        <SelectItem value="FEATURE">Feature</SelectItem>
                        <SelectItem value="BUG">Bug</SelectItem>
                        <SelectItem value="DESIGN">Design</SelectItem>
                        <SelectItem value="CONTENT">Content</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select priority..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Company & Project */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Controller
                  name="companyId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select company..." /></SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Controller
                  name="projectId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select project..." /></SelectTrigger>
                      <SelectContent>
                        {filteredProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} placeholder="Describe the change request in detail..." />
            </div>

            {/* Impact Description */}
            <div className="space-y-2">
              <Label>Impact Description</Label>
              <Textarea {...register('impactDescription')} rows={2} placeholder="What areas or deliverables will be impacted?" />
            </div>

            {/* Estimated Hours, Cost, Due Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input {...register('estimatedHours')} type="number" min="0" step="0.5" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Estimated Cost (AED)</Label>
                <Input {...register('estimatedCost')} type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input {...register('dueDate')} type="date" />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Change Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
