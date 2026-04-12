'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { FormCreateDialog } from './form-create-dialog'
import { FormSubmissionsDialog } from './form-submissions-dialog'
import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/lib/utils'
import { Plus, ExternalLink, List, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface LeadCaptureForm {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  _count: { submissions: number }
}

export function FormsContent() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewSubmissions, setViewSubmissions] = useState<LeadCaptureForm | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['lead-capture-forms'],
    queryFn: () => fetch('/api/forms').then(r => r.json()),
  })

  const forms: LeadCaptureForm[] = data?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/forms/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-capture-forms'] })
      toast.success('Form deleted')
    },
    onError: () => toast.error('Failed to delete form'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-capture-forms'] })
      toast.success('Form updated')
    },
    onError: () => toast.error('Failed to update form'),
  })

  const columns: ColumnDef<LeadCaptureForm, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Form Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.original.name}</p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <code className="text-xs bg-muted px-2 py-0.5 rounded">{row.original.slug}</code>
          <a
            href={`/forms/${row.original.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ),
    },
    {
      accessorKey: '_count.submissions',
      header: 'Submissions',
      cell: ({ row }) => (
        <span className="text-sm font-semibold">{row.original._count.submissions}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <button
          onClick={e => {
            e.stopPropagation()
            toggleActiveMutation.mutate({ id: row.original.id, isActive: !row.original.isActive })
          }}
          className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
            row.original.isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="View submissions"
            className="h-7 w-7"
            title="View Submissions"
            onClick={() => setViewSubmissions(row.original)}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete form"
            className="h-7 w-7 text-red-500 hover:text-red-600"
            onClick={() => deleteMutation.mutate(row.original.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Lead Capture Forms" description={`${forms.length} forms`}>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 me-2" /> New Form
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={forms}
          searchPlaceholder="Search forms..."
        />
      )}

      <FormCreateDialog open={showCreateForm} onOpenChange={setShowCreateForm} />

      {viewSubmissions && (
        <FormSubmissionsDialog
          open={!!viewSubmissions}
          onOpenChange={(open) => !open && setViewSubmissions(null)}
          formId={viewSubmissions.id}
          formName={viewSubmissions.name}
        />
      )}
    </div>
  )
}
