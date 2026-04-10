'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BundleFormDialog } from './bundle-form-dialog'
import { BundleDetailDialog } from './bundle-detail-dialog'
import { Plus, Package, Pencil, Trash2, Tag, Layers } from 'lucide-react'
import { toast } from 'sonner'

interface ServiceBundleItem {
  id: string
  quantity: number
  discount: number | null
  service: { id: string; name: string; category: string | null } | null
  package: { id: string; name: string; price: number | null } | null
}

interface ServiceBundle {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  currency: string
  isActive: boolean
  sortOrder: number
  items: ServiceBundleItem[]
}

export function BundlesContent() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBundle, setEditingBundle] = useState<ServiceBundle | null>(null)
  const [viewingBundle, setViewingBundle] = useState<ServiceBundle | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: () => fetch('/api/bundles').then(r => r.json()),
  })

  const bundles: ServiceBundle[] = data?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/bundles/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] })
      toast.success('Bundle deleted')
    },
    onError: () => toast.error('Failed to delete bundle'),
  })

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Service Bundles" description={`${bundles.length} bundles`}>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> New Bundle
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Package className="h-12 w-12" />
          <p className="text-base font-medium">No service bundles yet</p>
          <p className="text-sm">Create your first bundle to package services together</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 me-2" /> Create Bundle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map(bundle => (
            <Card
              key={bundle.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${!bundle.isActive ? 'opacity-60' : ''}`}
              onClick={() => setViewingBundle(bundle)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingBundle(bundle)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => deleteMutation.mutate(bundle.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{bundle.name}</CardTitle>
                {bundle.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{bundle.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {bundle.category && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      {bundle.category}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    {bundle.items.length} service{bundle.items.length !== 1 ? 's' : ''}
                  </div>
                  {bundle.price != null && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">Bundle Price</span>
                      <span className="text-sm font-semibold">
                        {bundle.currency} {bundle.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {!bundle.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded dark:bg-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BundleFormDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
      />

      {editingBundle && (
        <BundleFormDialog
          open={!!editingBundle}
          onOpenChange={(open) => !open && setEditingBundle(null)}
          bundle={editingBundle}
        />
      )}

      {viewingBundle && (
        <BundleDetailDialog
          open={!!viewingBundle}
          onOpenChange={(open) => !open && setViewingBundle(null)}
          bundleId={viewingBundle.id}
        />
      )}
    </div>
  )
}
