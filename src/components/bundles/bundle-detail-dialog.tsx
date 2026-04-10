'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'

interface BundleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bundleId: string
}

export function BundleDetailDialog({ open, onOpenChange, bundleId }: BundleDetailDialogProps) {
  const queryClient = useQueryClient()
  const [addingItem, setAddingItem] = useState(false)
  const [newServiceId, setNewServiceId] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['bundles', bundleId],
    queryFn: () => fetch(`/api/bundles/${bundleId}`).then(r => r.json()),
    enabled: open,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => fetch('/api/services?pageSize=200').then(r => r.json()),
    enabled: open,
  })

  const bundle = data?.data
  const services: Array<{ id: string; name: string }> = servicesData?.data ?? []

  const addItemMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/bundles/${bundleId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: newServiceId, quantity: newQuantity }),
      }).then(r => { if (!r.ok) throw new Error('Failed'); return r.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles', bundleId] })
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      toast.success('Item added to bundle')
      setAddingItem(false)
      setNewServiceId('')
      setNewQuantity(1)
    },
    onError: () => toast.error('Failed to add item'),
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      fetch(`/api/bundles/${bundleId}/items/${itemId}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles', bundleId] })
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      toast.success('Item removed')
    },
    onError: () => toast.error('Failed to remove item'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bundle?.name ?? 'Bundle Details'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : bundle ? (
          <div className="space-y-4">
            {bundle.description && (
              <p className="text-sm text-muted-foreground">{bundle.description}</p>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Services ({bundle.items?.length ?? 0})</h3>
              <Button size="sm" variant="outline" onClick={() => setAddingItem(true)}>
                <Plus className="h-3 w-3 me-1" /> Add Service
              </Button>
            </div>

            {addingItem && (
              <div className="p-3 border rounded-md space-y-3 bg-muted/30">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Service</Label>
                    <select
                      value={newServiceId}
                      onChange={e => setNewServiceId(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select service...</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Qty</Label>
                    <input
                      type="number"
                      min={1}
                      value={newQuantity}
                      onChange={e => setNewQuantity(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setAddingItem(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!newServiceId || addItemMutation.isPending}
                    onClick={() => addItemMutation.mutate()}
                  >
                    {addItemMutation.isPending && <Loader2 className="h-3 w-3 me-1 animate-spin" />}
                    Add
                  </Button>
                </div>
              </div>
            )}

            {(!bundle.items || bundle.items.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No services added to this bundle yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Service</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-center">Qty</TableHead>
                    <TableHead className="text-xs text-center">Discount</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.items.map((item: { id: string; quantity: number; discount: number | null; service: { name: string; category: string | null } | null; package: { name: string } | null }) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium">
                        {item.service?.name ?? item.package?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.service?.category ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-center">
                        {item.discount != null ? `${item.discount}%` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {bundle.price != null && (
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-muted-foreground">Bundle Price</span>
                <span className="text-base font-bold">{bundle.currency} {bundle.price.toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Bundle not found.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
