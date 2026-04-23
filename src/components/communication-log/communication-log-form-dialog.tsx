'use client'

import { useForm, Controller, useWatch } from 'react-hook-form'
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
  type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'SMS']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  subject: z.string().optional(),
  body: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  durationMinutes: z.string().optional(),
  loggedAt: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommunicationLogFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: () => fetch('/api/companies?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'list'],
    queryFn: () => fetch('/api/contacts?pageSize=100').then(r => r.json()),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
  })

  const companies: { id: string; displayName: string }[] = companiesData?.data ?? []
  const contacts: { id: string; firstName: string; lastName: string }[] = contactsData?.data ?? []

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'CALL',
      direction: 'OUTBOUND',
      loggedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const watchedType = useWatch({ control, name: 'type' })
  const isCall = watchedType === 'CALL'

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const durationSeconds = data.durationMinutes
        ? Math.round(parseFloat(data.durationMinutes) * 60)
        : undefined

      return fetch('/api/communication-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          direction: data.direction,
          subject: data.subject || undefined,
          body: data.body || undefined,
          companyId: data.companyId || undefined,
          contactId: data.contactId || undefined,
          durationSeconds: durationSeconds || undefined,
          loggedAt: data.loggedAt || undefined,
        }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] })
      toast.success('Interaction logged')
      reset()
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to log interaction'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="MEETING">Meeting</option>
                    <option value="NOTE">Note</option>
                    <option value="SMS">SMS</option>
                  </select>
                )}
              />
            </div>

            <div>
              <Label>Direction *</Label>
              <Controller
                name="direction"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                  </select>
                )}
              />
            </div>

            <div className="col-span-2">
              <Label>Subject</Label>
              <Input {...register('subject')} placeholder="e.g. Follow-up on proposal" className="mt-1" />
            </div>

            <div className="col-span-2">
              <Label>Body / Notes</Label>
              <Textarea {...register('body')} rows={4} placeholder="Details about the interaction..." className="mt-1" />
            </div>

            <div>
              <Label>Company</Label>
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
            </div>

            <div>
              <Label>Contact</Label>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <select {...field} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select contact...</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                )}
              />
            </div>

            {isCall && (
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  {...register('durationMinutes')}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 15"
                  className="mt-1"
                />
              </div>
            )}

            <div className={isCall ? '' : 'col-span-2'}>
              <Label>Date & Time</Label>
              <Input {...register('loggedAt')} type="datetime-local" className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Log Interaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
