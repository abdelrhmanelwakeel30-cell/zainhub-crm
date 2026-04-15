'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const taskSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'COMPLETED']),
  dueDate: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<TaskFormData>
}

export function TaskFormDialog({ open, onOpenChange, defaultValues }: TaskFormDialogProps) {
  const t = useTranslations('tasks')
  const tc = useTranslations('common')
  const queryClient = useQueryClient()

  const { data: usersData } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => fetch('/api/projects?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 0,
    refetchOnMount: true,
  })

  const users: { id: string; firstName: string; lastName: string }[] = usersData?.data ?? []
  const projects: { id: string; name: string }[] = projectsData?.data ?? []

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'TODO',
      ...defaultValues,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) =>
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate,
          assignedToId: data.assignedToId || undefined,
          projectId: data.projectId || undefined,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Task created successfully')
      reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to create task')
    },
  })

  const onSubmit = (data: TaskFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editTask') : t('newTask')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">{t('taskTitle')} *</Label>
              <Input id="title" {...register('title')} className="mt-1" />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea id="description" {...register('description')} rows={3} className="mt-1" />
            </div>

            <div>
              <Label>{t('project')}</Label>
              <select {...register('projectId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">{t('noProject')}</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>{t('assignedTo')}</Label>
              <select {...register('assignedToId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">{t('unassigned')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>{t('priority')}</Label>
              <select {...register('priority')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <Label>{t('status')}</Label>
              <select {...register('status')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <Label htmlFor="dueDate">{t('dueDate')}</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} className="mt-1" />
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
