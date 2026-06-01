'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Plus, ArrowUpDown, Loader2 } from 'lucide-react'

type Item = { id: string; sku: string; name: string; quantity: number | string; unitCost: number | string; isActive: boolean }

const num = (v: number | string) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })

export function InventoryContent() {
  const [showItem, setShowItem] = useState(false)
  const [moveItem, setMoveItem] = useState<Item | null>(null)

  const { data } = useQuery({ queryKey: ['items', 'list'], queryFn: () => fetch('/api/items?pageSize=200').then((r) => r.json()) })
  const items: Item[] = data?.data ?? []

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Inventory" description={`${data?.total ?? 0} items`}>
        <Button size="sm" onClick={() => setShowItem(true)}><Plus className="h-4 w-4 me-2" /> New item</Button>
      </PageHeader>

      <div className="rounded-lg border bg-card divide-y">
        {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No items yet.</p>}
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{it.sku}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.name}</p>
                <p className="text-xs text-muted-foreground">Unit cost {num(it.unitCost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-medium tabular-nums">{num(it.quantity)} <span className="text-xs text-muted-foreground">in stock</span></span>
              <Button size="sm" variant="outline" onClick={() => setMoveItem(it)}>
                <ArrowUpDown className="h-4 w-4 me-2" /> Movement
              </Button>
            </div>
          </div>
        ))}
      </div>

      <NewItemDialog open={showItem} onOpenChange={setShowItem} />
      <MovementDialog item={moveItem} onClose={() => setMoveItem(null)} />
    </div>
  )
}

function NewItemDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ sku: '', name: '', quantity: '', unitCost: '' })
  const createMutation = useMutation({
    mutationFn: () =>
      fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sku: form.sku, name: form.name, quantity: Number(form.quantity) || 0, unitCost: Number(form.unitCost) || 0 }) }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'create failed')
        return r.json()
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['items'] }); toast.success('Item created'); setForm({ sku: '', name: '', quantity: '', unitCost: '' }); onOpenChange(false) },
    onError: (e: Error) => toast.error(e.message || 'Could not create item'),
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New item</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5"><Label htmlFor="i-sku">SKU</Label><Input id="i-sku" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label htmlFor="i-name">Name</Label><Input id="i-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label htmlFor="i-qty">Opening qty</Label><Input id="i-qty" type="number" min="0" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} /></div>
          <div className="space-y-1.5"><Label htmlFor="i-cost">Unit cost</Label><Input id="i-cost" type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!form.sku.trim() || !form.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MovementDialog({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState('IN')
  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const moveMutation = useMutation({
    mutationFn: () =>
      fetch('/api/stock-movements', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemId: item!.id, type, quantity: Number(quantity), note: note || undefined }) }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || 'movement failed')
        return r.json()
      }),
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['items'] }); toast.success(`Stock updated → ${num(r.quantity)}`); setType('IN'); setQuantity(''); setNote(''); onClose() },
    onError: (e: Error) => toast.error(e.message || 'Movement failed'),
  })

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Stock movement — {item?.sku}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v ?? 'IN')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">IN (add)</SelectItem>
                  <SelectItem value="OUT">OUT (remove)</SelectItem>
                  <SelectItem value="ADJUST">ADJUST (set)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="m-qty">Quantity</Label><Input id="m-qty" type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="m-note">Note</Label><Input id="m-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" /></div>
          <p className="text-xs text-muted-foreground">Current stock: {item ? num(item.quantity) : '—'}</p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button disabled={!quantity || Number(quantity) < 0 || moveMutation.isPending} onClick={() => moveMutation.mutate()}>{moveMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />} Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
