'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ScoreIndicator } from '@/components/shared/score-indicator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AlertCircle, Archive, Download } from 'lucide-react'
import { getInitials, formatRelativeDate } from '@/lib/utils'

type Lead = {
  id: string
  leadNumber: string
  fullName: string
  companyName?: string
  stage?: { name: string }
  source?: { name: string }
  urgency: string
  score: number
  assignedTo?: { firstName: string; lastName: string }
  interestedService?: { name: string }
  createdAt: string
}

export function LeadsTable({ filters }: { filters?: { urgency?: string } }) {
  const router = useRouter()
  const t = useTranslations('leads')
  const queryClient = useQueryClient()

  const urgency = filters?.urgency ?? ''
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leads', 'list', urgency],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: '100' })
      if (urgency) params.set('urgency', urgency)
      const res = await fetch(`/api/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load leads')
      return res.json()
    },
  })

  const leads: Lead[] = data?.data ?? []

  // C-3: bulk archive
  const archiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'archive', ids }),
      })
      if (!res.ok) throw new Error('Bulk archive failed')
      return res.json()
    },
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(`Archived ${r.count ?? 0} lead(s)`)
    },
    onError: () => toast.error('Could not archive the selected leads'),
  })

  function exportSelected(ids: string[]) {
    const set = new Set(ids)
    const selected = leads.filter((l) => set.has(l.id))
    const headers = ['Lead #', 'Full Name', 'Company', 'Stage', 'Urgency', 'Score', 'Created At']
    const rows = selected.map((l) => [
      l.leadNumber, l.fullName, l.companyName ?? '', l.stage?.name ?? '', l.urgency, l.score,
      new Date(l.createdAt).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-selected-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Lead, unknown>[] = [
    {
      accessorKey: 'leadNumber',
      header: '#',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.leadNumber}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'fullName',
      header: t('fullName'),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.fullName}</p>
          {row.original.companyName && (
            <p className="text-xs text-muted-foreground">{row.original.companyName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stage',
      header: t('stage'),
      cell: ({ row }) => <StatusBadge status={row.original.stage?.name ?? ''} />,
    },
    {
      accessorKey: 'source',
      header: t('source'),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.source?.name}</span>
      ),
    },
    {
      accessorKey: 'urgency',
      header: t('urgency'),
      cell: ({ row }) => <StatusBadge status={row.original.urgency} />,
    },
    {
      accessorKey: 'score',
      header: t('score'),
      cell: ({ row }) => <ScoreIndicator score={row.original.score} size="sm" />,
    },
    {
      accessorKey: 'assignedTo',
      header: t('assignedTo'),
      cell: ({ row }) => {
        const user = row.original.assignedTo
        if (!user) return <span className="text-xs text-muted-foreground italic">Unassigned</span>
        const fullName = `${user.firstName} ${user.lastName}`
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">{getInitials(fullName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'interestedService',
      header: t('interestedService'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.interestedService?.name}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatRelativeDate(row.original.createdAt)}</span>
      ),
    },
  ]

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Unable to load leads. Please refresh the page or contact support if the issue persists.</span>
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={leads}
      isLoading={isLoading}
      searchPlaceholder={`${t('title')}...`}
      onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
      enableSelection
      getRowId={(lead) => lead.id}
      renderBulkActions={(ids, clear) => (
        <>
          <Button variant="outline" size="sm" onClick={() => exportSelected(ids)}>
            <Download className="h-4 w-4 me-2" /> Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate(ids, { onSuccess: clear })}
          >
            <Archive className="h-4 w-4 me-2" /> Archive
          </Button>
        </>
      )}
    />
  )
}
