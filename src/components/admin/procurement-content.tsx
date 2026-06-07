'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, Building, ShoppingCart, Trash2, Loader2 } from 'lucide-react'

type Vendor = { id: string; name: string; email?: string | null; phone?: string | null; isActive: boolean }
type PO = { id: string; poNumber: string; status: string; currency: string; totalAmount: number | string; vendor?: { name: string } | null; _count?: { lines: number } }

const money = (v: number | string, c = 'AED') => `${c} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const NEXT_ACTION: Record<string, { action: 'submit' | 'approve' | 'receive'; label: string } | undefined> = {
  DRAFT: { action: 'submit', label: 'Submit' },
  SUBMITTED: { action: 'approve', label: 'Approve' },
  APPROVED: { action: 'receive', label: 'Receive' },
}

export function ProcurementContent() {
  const t = useTranslations('erp')
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'vendors' | 'pos'>('pos')
  const [showVendor, setShowVendor] = useState(false)
  const [showPO, setShowPO] = useState(false)

  const { data: vData } = useQuery({ queryKey: ['vendors', 'list'], queryFn: () => fetch('/api/vendors?pageSize=200').then((r) => r.json()) })
  const vendors: Vendor[] = vData?.data ?? []

  const { data: poData } = useQuery({ queryKey: ['purchase-orders', 'list'], queryFn: () => fetch('/api/purchase-orders?pageSize=100').then((r) => r.json()) })
  const pos: PO[] = poData?.data ?? []

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      fetch(`/api/purchase-orders/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'action failed')
        return r.json()
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success('Purchase order updated') },
    onError: (e: Error) => toast.error(e.message || 'Action failed'),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title={t('procurementTitle')} description={t('procurementSubtitle', { vendors: vData?.total ?? 0, orders: poData?.total ?? 0 })}>
        {tab === 'vendors' ? (
          <Button size="sm" onClick={() => setShowVendor(true)}><Plus className="h-4 w-4 me-2" /> New vendor</Button>
        ) : (
          <Button size="sm" onClick={() => setShowPO(true)} disabled={vendors.length === 0}><Plus className="h-4 w-4 me-2" /> New PO</Button>
        )}
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'vendors' | 'pos')}>
        <TabsList>
          <TabsTrigger value="pos" className="gap-1.5"><ShoppingCart className="h-4 w-4" /> Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors" className="gap-1.5"><Building className="h-4 w-4" /> Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {pos.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No purchase orders yet.</p>}
            {pos.map((po) => {
              const next = NEXT_ACTION[po.status]
              return (
                <div key={po.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium"><span className="font-mono text-xs text-muted-foreground me-2">{po.poNumber}</span>{po.vendor?.name}</p>
                    <p className="text-xs text-muted-foreground">{po._count?.lines ?? 0} line(s) · {money(po.totalAmount, po.currency)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={po.status} />
                    {next && (
                      <Button size="sm" variant="outline" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ id: po.id, action: next.action })}>
                        {next.label}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {vendors.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No vendors yet.</p>}
            {vendors.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{[v.email, v.phone].filter(Boolean).join(' · ') || '—'}</p>
                </div>
                {!v.isActive && <span className="text-[11px] text-muted-foreground">inactive</span>}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NewVendorDialog open={showVendor} onOpenChange={setShowVendor} />
      <NewPODialog open={showPO} onOpenChange={setShowPO} vendors={vendors} />
    </div>
  )
}

function NewVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const createMutation = useMutation({
    mutationFn: () => fetch('/api/vendors', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }).then(async (r) => { if (!r.ok) throw new Error('create failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor created'); setForm({ name: '', email: '', phone: '' }); onOpenChange(false) },
    onError: () => toast.error('Could not create vendor'),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New vendor</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label htmlFor="v-name">Name</Label><Input id="v-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="v-email">Email</Label><Input id="v-email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="v-phone">Phone</Label><Input id="v-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type POLine = { description: string; quantity: string; unitPrice: string }
const emptyPOLine = (): POLine => ({ description: '', quantity: '', unitPrice: '' })

function NewPODialog({ open, onOpenChange, vendors }: { open: boolean; onOpenChange: (o: boolean) => void; vendors: Vendor[] }) {
  const t = useTranslations('erp')
  const queryClient = useQueryClient()
  const [vendorId, setVendorId] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<POLine[]>([emptyPOLine()])

  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0)
  const valid = vendorId && lines.length > 0 && lines.every((l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitPrice) >= 0)
  const setLine = (i: number, patch: Partial<POLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const createMutation = useMutation({
    mutationFn: () => fetch('/api/purchase-orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vendorId, notes: notes || undefined, lines: lines.map((l) => ({ description: l.description, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })) }),
    }).then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'create failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success('Purchase order created'); setVendorId(''); setNotes(''); setLines([emptyPOLine()]); onOpenChange(false) },
    onError: (e: Error) => toast.error(e.message || 'Could not create PO'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New purchase order</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select value={vendorId} onValueChange={(v) => setVendorId(v ?? '')}>
                <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="po-notes">Notes</Label><Input id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" /></div>
          </div>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_28px] gap-2 items-center">
                <Input placeholder="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                <Input type="number" min="0" step="1" placeholder="Qty" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                <Input type="number" min="0" step="0.01" placeholder="Unit price" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" aria-label={t('removeLine')} className="h-8 w-8" disabled={lines.length <= 1} onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, emptyPOLine()])}><Plus className="h-4 w-4 me-2" /> Add line</Button>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{money(total)}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!valid || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create PO</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
