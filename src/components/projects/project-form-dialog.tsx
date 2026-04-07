'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { companies, services, users } from '@/lib/demo-data'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  service: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  targetEndDate: z.string().optional(),
  budget: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'DISCOVERY', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: Partial<ProjectFormData>
}

export function ProjectFormDialog({ open, onOpenChange, defaultValues }: ProjectFormDialogProps) {
  const t = useTranslations('projects')
  const tc = useTranslations('common')
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'NOT_STARTED',
      ...defaultValues,
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setSaving(true)
    // Simulate save
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success('Project created successfully')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editProject') : t('newProject')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input id="name" {...register('name')} className="mt-1" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">{tc('description')}</Label>
              <Textarea id="description" {...register('description')} rows={3} className="mt-1" />
            </div>

            <div>
              <Label>{t('client')} *</Label>
              <select {...register('clientId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">{tc('select')}...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.displayName}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>

            <div>
              <Label>{t('service')}</Label>
              <select {...register('service')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">{tc('select')}...</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>{t('owner')}</Label>
              <select {...register('ownerId')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">{tc('select')}...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>{t('status')}</Label>
              <select {...register('status')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="NOT_STARTED">Not Started</option>
                <option value="DISCOVERY">Discovery</option>
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <Label htmlFor="startDate">{t('startDate')}</Label>
              <Input id="startDate" type="date" {...register('startDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="targetEndDate">{t('targetEndDate')}</Label>
              <Input id="targetEndDate" type="date" {...register('targetEndDate')} className="mt-1" />
            </div>

            <div>
              <Label htmlFor="budget">{t('budget')}</Label>
              <Input id="budget" type="number" {...register('budget')} placeholder="e.g. 50000" className="mt-1" />
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
