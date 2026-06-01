'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, BookOpen, ListTree, BadgeCheck, Trash2, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const

type Account = { id: string; code: string; name: string; type: string; isActive: boolean }
type Entry = { id: string; entryNumber: string; date: string; memo?: string | null; status: string; _count?: { lines: number } }

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function AccountingContent() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'accounts' | 'journal'>('accounts')
  const [showAccount, setShowAccount] = useState(false)
  const [showEntry, setShowEntry] = useState(false)

  const { data: accData } = useQuery({
    queryKey: ['accounts', 'list'],
    queryFn: () => fetch('/api/accounts?pageSize=200').then((r) => r.json()),
  })
  const accounts: Account[] = accData?.data ?? []

  const { data: jeData } = useQuery({
    queryKey: ['journal-entries', 'list'],
    queryFn: () => fetch('/api/journal-entries?pageSize=100').then((r) => r.json()),
  })
  const entries: Entry[] = jeData?.data ?? []

  const postMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/journal-entries/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'post' }),
      }).then((r) => {
        if (!r.ok) throw new Error('post failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      toast.success('Journal entry posted')
    },
    onError: () => toast.error('Could not post the entry'),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Accounting" description={`${accData?.total ?? 0} accounts · ${jeData?.total ?? 0} journal entries`}>
        {tab === 'accounts' ? (
          <Button size="sm" onClick={() => setShowAccount(true)}><Plus className="h-4 w-4 me-2" /> New account</Button>
        ) : (
          <Button size="sm" onClick={() => setShowEntry(true)}><Plus className="h-4 w-4 me-2" /> New entry</Button>
        )}
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'accounts' | 'journal')}>
        <TabsList>
          <TabsTrigger value="accounts" className="gap-1.5"><BookOpen className="h-4 w-4" /> Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal" className="gap-1.5"><ListTree className="h-4 w-4" /> Journal Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {accounts.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No accounts yet.</p>}
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground w-14">{a.code}</span>
                  <span className="text-sm font-medium truncate">{a.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">{a.type}</span>
                  {!a.isActive && <span className="text-[11px] text-muted-foreground">inactive</span>}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="journal" className="mt-4">
          <div className="rounded-lg border bg-card divide-y">
            {entries.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No journal entries yet.</p>}
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <span className="font-mono text-xs text-muted-foreground me-2">{e.entryNumber}</span>
                    {formatDate(e.date)} {e.memo ? <span className="text-muted-foreground">· {e.memo}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{e._count?.lines ?? 0} line(s)</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={e.status} />
                  {e.status === 'DRAFT' && (
                    <Button size="sm" variant="outline" disabled={postMutation.isPending} onClick={() => postMutation.mutate(e.id)}>
                      <BadgeCheck className="h-4 w-4 me-2" /> Post
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NewAccountDialog open={showAccount} onOpenChange={setShowAccount} />
      <NewEntryDialog open={showEntry} onOpenChange={setShowEntry} accounts={accounts} />
    </div>
  )
}

function NewAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET' })

  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/accounts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'create failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account created')
      setForm({ code: '', name: '', type: 'ASSET' })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not create account'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New account</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-code">Code</Label>
            <Input id="acc-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="1000" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v ?? 'ASSET' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label htmlFor="acc-name">Name</Label>
            <Input id="acc-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Cash" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!form.code.trim() || !form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type DraftLine = { accountId: string; debit: string; credit: string; description: string }
const emptyLine = (): DraftLine => ({ accountId: '', debit: '', credit: '', description: '' })

function NewEntryDialog({ open, onOpenChange, accounts }: { open: boolean; onOpenChange: (o: boolean) => void; accounts: Account[] }) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState('')
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine(), emptyLine()])

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const balanced = totalDebit > 0 && Math.round(totalDebit * 100) === Math.round(totalCredit * 100)
  const allHaveAccount = lines.every((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))

  const setLine = (i: number, patch: Partial<DraftLine>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/journal-entries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          date,
          memo: memo || undefined,
          lines: lines.map((l) => ({ accountId: l.accountId, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, description: l.description || undefined })),
        }),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'create failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      toast.success('Journal entry created')
      setDate(''); setMemo(''); setLines([emptyLine(), emptyLine()])
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message || 'Could not create entry'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>New journal entry</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="je-date">Date</Label>
              <Input id="je-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="je-memo">Memo</Label>
              <Input id="je-memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_90px_28px] gap-2 items-center">
                <Select value={l.accountId} onValueChange={(v) => setLine(i, { accountId: v ?? '' })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Account" /></SelectTrigger>
                  <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} · {a.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" min="0" step="0.01" placeholder="Debit" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })} />
                <Input type="number" min="0" step="0.01" placeholder="Credit" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={lines.length <= 2} onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])}>
              <Plus className="h-4 w-4 me-2" /> Add line
            </Button>
          </div>

          <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${balanced ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
            <span>Debits {money(totalDebit)} · Credits {money(totalCredit)}</span>
            <span className="font-medium">{balanced ? 'Balanced' : `Off by ${money(Math.abs(totalDebit - totalCredit))}`}</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!date || !balanced || !allHaveAccount || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
