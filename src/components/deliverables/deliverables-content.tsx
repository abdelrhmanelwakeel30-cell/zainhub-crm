'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { DeliverableFormDialog } from './deliverable-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus, Package, ExternalLink, Trash2, Eye, Users, Globe,
  Palette, Code2, FileText, BarChart2, Layers
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Deliverable {
  id: string
  name: string
  description: string | null
  type: string
  visibility: string
  fileUrl: string
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  version: number
  project: { id: string; name: string } | null
  uploadedBy: { id: string; firstName: string; lastName: string } | null
  createdAt: string
}

const typeIcons: Record<string, React.ElementType> = {
  DESIGN: Palette,
  CODE: Code2,
  DOCUMENT: FileText,
  REPORT: BarChart2,
  ASSET: Layers,
  OTHER: Package,
}

const typeBadgeColors: Record<string, string> = {
  DESIGN: 'bg-pink-50 text-pink-700 border-pink-200',
  CODE: 'bg-blue-50 text-blue-700 border-blue-200',
  DOCUMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  REPORT: 'bg-purple-50 text-purple-700 border-purple-200',
  ASSET: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
}

const visibilityBadgeColors: Record<string, string> = {
  INTERNAL: 'bg-gray-50 text-gray-600 border-gray-200',
  CLIENT: 'bg-green-50 text-green-700 border-green-200',
  PUBLIC: 'bg-blue-50 text-blue-700 border-blue-200',
}

const visibilityIcons: Record<string, React.ElementType> = {
  INTERNAL: Users,
  CLIENT: Eye,
  PUBLIC: Globe,
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type TabValue = 'all' | 'INTERNAL' | 'CLIENT' | 'PUBLIC'

export function DeliverablesContent() {
  const [showCreate, setShowCreate] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['deliverables'],
    queryFn: () => fetch('/api/deliverables').then(r => r.json()),
  })

  const allDeliverables: Deliverable[] = data?.data ?? []

  const filtered = activeTab === 'all'
    ? allDeliverables
    : allDeliverables.filter(d => d.visibility === activeTab)

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/deliverables/${id}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] })
      toast.success('Deliverable deleted')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const tabs: { value: TabValue; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: allDeliverables.length },
    { value: 'INTERNAL', label: 'Internal', count: allDeliverables.filter(d => d.visibility === 'INTERNAL').length },
    { value: 'CLIENT', label: 'Client-Visible', count: allDeliverables.filter(d => d.visibility === 'CLIENT').length },
    { value: 'PUBLIC', label: 'Public', count: allDeliverables.filter(d => d.visibility === 'PUBLIC').length },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Deliverables" description={`${allDeliverables.length} total deliverables`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" />
          Add Deliverable
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No deliverables</h3>
          <p className="text-sm text-muted-foreground mb-4">Track files and assets delivered to clients.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 me-2" />
            Add Deliverable
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Visibility</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Version</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Uploaded By</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Size</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3 text-start font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((d) => {
                    const TypeIcon = typeIcons[d.type] ?? Package
                    const VisibilityIcon = visibilityIcons[d.visibility] ?? Eye
                    return (
                      <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium">{d.name}</p>
                              {d.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs font-medium ${typeBadgeColors[d.type] ?? ''}`}>
                            {d.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-xs font-medium flex items-center gap-1 w-fit ${visibilityBadgeColors[d.visibility] ?? ''}`}>
                            <VisibilityIcon className="h-3 w-3" />
                            {d.visibility}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {d.project?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          v{d.version}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatFileSize(d.fileSize)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(d.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title="Open file"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <AlertDialog>
                              <AlertDialogTrigger
                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete deliverable?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. &ldquo;{d.name}&rdquo; will be permanently removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(d.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <DeliverableFormDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  )
}
