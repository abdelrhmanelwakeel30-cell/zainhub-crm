'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { TicketsTable } from './tickets-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Download, Ticket, AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'

interface TicketFormData {
  subject: string
  type: string
  priority: string
  assignedToId: string
  contactId: string
  description: string
}

export function TicketsContent() {
  const t = useTranslations('tickets')
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()

  const { data: ticketsResponse } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => fetch('/api/tickets').then(r => r.json()),
  })
  const tickets = ticketsResponse?.data ?? []

  const { data: usersResponse } = useQuery({
    queryKey: ['users', 'minimal'],
    queryFn: () => fetch('/api/users?minimal=true').then(r => r.json()),
    enabled: showCreate,
  })
  const users = usersResponse?.data ?? []

  const totalTickets = tickets.length
  const openTickets = tickets.filter((t: { status: string }) => t.status === 'OPEN' || t.status === 'NEW').length
  const inProgress = tickets.filter((t: { status: string }) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_CLIENT').length
  const resolved = tickets.filter((t: { status: string }) => t.status === 'RESOLVED' || t.status === 'CLOSED').length

  const { register, handleSubmit, control, reset } = useForm<TicketFormData>({
    defaultValues: { type: '', priority: 'MEDIUM', assignedToId: '', contactId: '', description: '', subject: '' },
  })

  const { data: contactsResponse } = useQuery({
    queryKey: ['contacts', 'minimal'],
    queryFn: () => fetch('/api/contacts?pageSize=100').then(r => r.json()),
    enabled: showCreate,
  })
  const contacts = contactsResponse?.data ?? []

  const mutation = useMutation({
    mutationFn: (data: TicketFormData) => fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: data.subject,
        description: data.description,
        priority: data.priority || undefined,
        type: data.type || undefined,
        assignedToId: data.assignedToId || undefined,
        contactId: data.contactId || undefined,
      }),
    }).then(async (r) => {
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Failed') }
      return r.json()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast.success('Ticket created successfully')
      reset()
      setShowCreate(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('title')} description={`${totalTickets} ${t('allTickets').toLowerCase()}`}>
        <Button variant="outline" size="sm" onClick={() => toast.success('Export started')}>
          <Download className="h-4 w-4 me-2" />
          {t('export')}
        </Button>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t('newTicket')}
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalTickets')}
          value={totalTickets}
          icon={<Ticket className="h-5 w-5" />}
        />
        <KPICard
          title={t('openTickets')}
          value={openTickets}
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <KPICard
          title={t('inProgress')}
          value={inProgress}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          title={t('resolved')}
          value={resolved}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <TicketsTable />

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('newTicket')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input {...register('subject')} placeholder="Describe the issue briefly..." />
              </div>
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
                          <SelectItem value="BUG">Bug</SelectItem>
                          <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                          <SelectItem value="SUPPORT">Support</SelectItem>
                          <SelectItem value="QUESTION">Question</SelectItem>
                          <SelectItem value="CHANGE_REQUEST">Change Request</SelectItem>
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
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Controller
                  name="assignedToId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select team member..." /></SelectTrigger>
                      <SelectContent>
                        {users.map((u: { id: string; firstName: string; lastName: string }) => (
                          <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Controller
                  name="contactId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select contact (optional)..." /></SelectTrigger>
                      <SelectContent>
                        {contacts.map((c: { id: string; firstName: string; lastName: string }) => (
                          <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea {...register('description')} rows={3} placeholder="Provide details about the issue..." />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
