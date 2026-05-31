'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, Play, BadgeCheck, Receipt, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Run = {
  id: string
  runNumber: string
  periodStart: string
  periodEnd: string
  status: string
  currency: string
  totalGross: number | string
  totalNet: number | string
  _count?: { payslips: number }
}
type Payslip = {
  id: string
  gross: number | string
  deductions: number | string
  net: number | string
  status: string
  employee?: { firstName: string; lastName: string; employeeNumber: string } | null
}

const money = (v: number | string, c = 'AED') => `${c} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function PayrollContent() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [payslipRun, setPayslipRun] = useState<Run | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-runs', 'list'],
    queryFn: () => fetch('/api/payroll-runs?pageSize=100').then((r) => r.json()),
  })
  const runs: Run[] = data?.data ?? []

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'process' | 'mark-paid' }) =>
      fetch(`/api/payroll-runs/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'action failed')
        return r.json()
      }),
    onSuccess: (_r, v) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      toast.success(v.action === 'process' ? 'Payroll processed' : 'Marked as paid')
    },
    onError: (e: Error) => toast.error(e.message || 'Action failed'),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Payroll" description={`${data?.total ?? 0} payroll runs`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" /> New run
        </Button>
      </PageHeader>

      <div className="rounded-lg border bg-card divide-y">
        {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && runs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No payroll runs yet.</p>}
        {runs.map((run) => (
          <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                <span className="font-mono text-xs text-muted-foreground me-2">{run.runNumber}</span>
                {formatDate(run.periodStart)} → {formatDate(run.periodEnd)}
              </p>
              <p className="text-xs text-muted-foreground">
                {run._count?.payslips ?? 0} payslip(s) · Gross {money(run.totalGross, run.currency)} · Net {money(run.totalNet, run.currency)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={run.status} />
              <Button variant="outline" size="sm" onClick={() => setPayslipRun(run)}>
                <Receipt className="h-4 w-4 me-2" /> Payslips
              </Button>
              {run.status === 'DRAFT' && (
                <Button size="sm" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ id: run.id, action: 'process' })}>
                  <Play className="h-4 w-4 me-2" /> Process
                </Button>
              )}
              {run.status === 'PROCESSED' && (
                <Button size="sm" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ id: run.id, action: 'mark-paid' })}>
                  <BadgeCheck className="h-4 w-4 me-2" /> Mark paid
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <NewRunDialog open={showCreate} onOpenChange={setShowCreate} />
      <PayslipsDialog run={payslipRun} onClose={() => setPayslipRun(null)} />
    </div>
  )
}

function NewRunDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/payroll-runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ periodStart, periodEnd }),
      }).then(async (r) => {
        if (!r.ok) throw new Error('create failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] })
      toast.success('Payroll run created')
      setPeriodStart('')
      setPeriodEnd('')
      onOpenChange(false)
    },
    onError: () => toast.error('Could not create the run'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New payroll run</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ps">Period start</Label>
            <Input id="ps" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pe">Period end</Label>
            <Input id="pe" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!periodStart || !periodEnd || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            Create run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PayslipsDialog({ run, onClose }: { run: Run | null; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['payslips', run?.id],
    queryFn: () => fetch(`/api/payslips?payrollRunId=${run!.id}&pageSize=200`).then((r) => r.json()),
    enabled: !!run,
  })
  const payslips: Payslip[] = data?.data ?? []

  return (
    <Dialog open={!!run} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Payslips — {run?.runNumber}</DialogTitle></DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto divide-y">
          {payslips.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No payslips for this run.</p>}
          {payslips.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Employee'}
                  <span className="ms-2 font-mono text-xs text-muted-foreground">{p.employee?.employeeNumber}</span>
                </p>
                <p className="text-xs text-muted-foreground">Gross {money(p.gross, run?.currency)} · Net {money(p.net, run?.currency)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
