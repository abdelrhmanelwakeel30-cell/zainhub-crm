'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, Building2, PieChart, Loader2 } from 'lucide-react'

type CostCenter = { id: string; code: string; name: string }
type Budget = { id: string; periodLabel: string; amount: number | string; spent: number | string; currency: string; costCenter?: { code: string; name: string } | null }

const money = (v: number | string, c = 'AED') => `${c} ${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export function BudgetingContent() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'budgets' | 'centers'>('budgets')
  const [showCenter, setShowCenter] = useState(false)
  const [showBudget, setShowBudget] = useState(false)

  const { data: ccData } = useQuery({ queryKey: ['cost-centers', 'list'], queryFn: () => fetch('/api/cost-centers?pageSize=200').then((r) => r.json()) })
  const centers: CostCenter[] = ccData?.data ?? []
  const { data: bData } = useQuery({ queryKey: ['budgets', 'list'], queryFn: () => fetch('/api/budgets?pageSize=200').then((r) => r.json()) })
  const budgets: Budget[] = bData?.data ?? []

  const spendMutation = useMutation({
    mutationFn: ({ id, spend }: { id: string; spend: number }) =>
      fetch('/api/budgets', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, spend }) }).then(async (r) => { if (!r.ok) throw new Error('failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Spend recorded') },
    onError: () => toast.error('Could not record spend'),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Budgeting" description={`${ccData?.total ?? 0} cost centers · ${bData?.total ?? 0} budgets`}>
        {tab === 'centers'
          ? <Button size="sm" onClick={() => setShowCenter(true)}><Plus className="h-4 w-4 me-2" /> New cost center</Button>
          : <Button size="sm" onClick={() => setShowBudget(true)} disabled={centers.length === 0}><Plus className="h-4 w-4 me-2" /> New budget</Button>}
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'budgets' | 'centers')}>
        <TabsList>
          <TabsTrigger value="budgets" className="gap-1.5"><PieChart className="h-4 w-4" /> Budgets</TabsTrigger>
          <TabsTrigger value="centers" className="gap-1.5"><Building2 className="h-4 w-4" /> Cost Centers</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="mt-4 space-y-3">
          {budgets.length === 0 && <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No budgets yet.</div>}
          {budgets.map((b) => {
            const amount = Number(b.amount), spent = Number(b.spent)
            const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0
            const over = spent > amount
            return (
              <div key={b.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.costCenter?.code} · {b.costCenter?.name} <span className="text-muted-foreground">· {b.periodLabel}</span></p>
                    <p className="text-xs text-muted-foreground">{money(spent, b.currency)} of {money(b.amount, b.currency)} · {money(amount - spent, b.currency)} left</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { const v = window.prompt('Record spend (use negative to reverse)'); const n = v ? Number(v) : NaN; if (!Number.isNaN(n)) spendMutation.mutate({ id: b.id, spend: n }) }}>Record spend</Button>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full rounded-full" style={{ background: over ? '#dc2626' : 'linear-gradient(90deg,#1E3A8A,#3B82F6)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                </div>
                <p className={`mt-1 text-[11px] ${over ? 'text-red-600' : 'text-muted-foreground'}`}>{pct.toFixed(0)}% utilized{over ? ' · OVER BUDGET' : ''}</p>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="centers" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {centers.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No cost centers yet.</p>}
            {centers.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3.5">
                <span className="font-mono text-xs text-muted-foreground w-16">{c.code}</span>
                <span className="text-sm font-medium">{c.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NewCenterDialog open={showCenter} onOpenChange={setShowCenter} />
      <NewBudgetDialog open={showBudget} onOpenChange={setShowBudget} centers={centers} />
    </div>
  )
}

function NewCenterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ code: '', name: '' })
  const m = useMutation({
    mutationFn: () => fetch('/api/cost-centers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }).then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cost-centers'] }); toast.success('Cost center created'); setForm({ code: '', name: '' }); onOpenChange(false) },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New cost center</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5"><Label htmlFor="cc-code">Code</Label><Input id="cc-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CC-100" /></div>
          <div className="space-y-1.5"><Label htmlFor="cc-name">Name</Label><Input id="cc-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Marketing" /></div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!form.code.trim() || !form.name.trim() || m.isPending} onClick={() => m.mutate()}>{m.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewBudgetDialog({ open, onOpenChange, centers }: { open: boolean; onOpenChange: (o: boolean) => void; centers: CostCenter[] }) {
  const queryClient = useQueryClient()
  const [costCenterId, setCostCenterId] = useState('')
  const [periodLabel, setPeriodLabel] = useState('')
  const [amount, setAmount] = useState('')
  const m = useMutation({
    mutationFn: () => fetch('/api/budgets', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ costCenterId, periodLabel, amount: Number(amount) }) }).then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'failed'); return r.json() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget created'); setCostCenterId(''); setPeriodLabel(''); setAmount(''); onOpenChange(false) },
    onError: (e: Error) => toast.error(e.message || 'Failed'),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New budget</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Cost center</Label>
            <Select value={costCenterId} onValueChange={(v) => setCostCenterId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{centers.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="b-period">Period</Label><Input id="b-period" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="2026-Q2" /></div>
            <div className="space-y-1.5"><Label htmlFor="b-amount">Amount</Label><Input id="b-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!costCenterId || !periodLabel.trim() || !(Number(amount) > 0) || m.isPending} onClick={() => m.mutate()}>{m.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
