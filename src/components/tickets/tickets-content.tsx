'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { tickets, users } from '@/lib/demo-data'
import { toast } from 'sonner'

export function TicketsContent() {
  const t = useTranslations('tickets')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)

  const totalTickets = tickets.length
  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'NEW').length
  const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING_CLIENT').length
  const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length

  const handleCreateTicket = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setShowCreate(false)
    toast.success('Ticket created successfully')
  }

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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input placeholder="Describe the issue briefly..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUG">Bug</SelectItem>
                    <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                    <SelectItem value="QUESTION">Question</SelectItem>
                    <SelectItem value="CHANGE_REQUEST">Change Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select priority..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select team member..." /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Provide details about the issue..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleCreateTicket} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
