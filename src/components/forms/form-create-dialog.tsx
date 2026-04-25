'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FormFieldBuilder, FormField } from './form-field-builder'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  sourceTag: z.string().optional(),
  isActive: z.boolean().default(true),
  thankYouMsg: z.string().optional(),
  redirectUrl: z.string().optional(),
})

type FormCreateData = z.infer<typeof formSchema>

interface FormCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FormCreateDialog({ open, onOpenChange }: FormCreateDialogProps) {
  const queryClient = useQueryClient()
  const [fields, setFields] = useState<FormField[]>([
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'phone', required: false },
  ])

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { isActive: true },
  })

  // Auto-generate slug from name
  const nameValue = watch('name') as string | undefined

  const mutation = useMutation({
    mutationFn: (data: FormCreateData) =>
      fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, fields }),
      }).then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Failed') })
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-capture-forms'] })
      toast.success('Form created')
      reset()
      setFields([
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'phone', required: false },
      ])
      onOpenChange(false)
    },
     
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to create form'),
  })

  const autoSlug = () => {
    if (nameValue) {
      setValue('slug', nameValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Lead Capture Form</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d as FormCreateData))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Form Name *</Label>
              <Input
                {...register('name')}
                className="mt-1"
                placeholder="e.g. Contact Us"
                onBlur={autoSlug}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>URL Slug *</Label>
              <Input {...register('slug')} className="mt-1" placeholder="e.g. contact-us" />
              {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">Used in: /forms/[slug]</p>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} rows={2} className="mt-1" placeholder="Optional description shown on the form..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source Tag</Label>
              <Input {...register('sourceTag')} className="mt-1" placeholder="e.g. website, linkedin" />
              <p className="text-xs text-muted-foreground mt-1">Tags leads with this source</p>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input type="checkbox" id="isActiveForm" {...register('isActive')} className="rounded border-input" />
              <Label htmlFor="isActiveForm">Active (accept submissions)</Label>
            </div>
          </div>

          <div>
            <Label>Thank You Message</Label>
            <Textarea {...register('thankYouMsg')} rows={2} className="mt-1" placeholder="Thank you for reaching out! We'll get back to you shortly." />
          </div>

          <div>
            <Label>Redirect URL (optional)</Label>
            <Input {...register('redirectUrl')} className="mt-1" placeholder="https://yourdomain.com/thank-you" />
            <p className="text-xs text-muted-foreground mt-1">If set, redirects after submission instead of showing thank you message</p>
          </div>

          <div>
            <Label className="mb-2 block">Form Fields</Label>
            <FormFieldBuilder fields={fields} onChange={setFields} />
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending || fields.length === 0}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Form
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
