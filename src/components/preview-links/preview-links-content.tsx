'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { PreviewLinkFormDialog } from './preview-link-form-dialog'
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
  Plus, Eye, Copy, ExternalLink, MessageSquare, Calendar,
  CheckCircle, AlertCircle, Clock, Link as LinkIcon, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface PreviewLink {
  id: string
  title: string
  url: string
  type: string
  status: string
  projectId: string | null
  project: { id: string; name: string } | null
  sharedWithCompany: { id: string; displayName: string } | null
  sharedByUser: { id: string; firstName: string; lastName: string } | null
  expiresAt: string | null
  accessCount: number
  notes: string | null
  createdAt: string
  _count: { feedbacks: number }
}

const typeBadgeColors: Record<string, string> = {
  WEBSITE: 'bg-blue-50 text-blue-700 border-blue-200',
  SYSTEM: 'bg-purple-50 text-purple-700 border-purple-200',
  PROTOTYPE: 'bg-amber-50 text-amber-700 border-amber-200',
  STAGING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  DEMO: 'bg-green-50 text-green-700 border-green-200',
  DESIGN: 'bg-pink-50 text-pink-700 border-pink-200',
}

export function PreviewLinksContent() {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedFeedbackLink, setSelectedFeedbackLink] = useState<PreviewLink | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['preview-links'],
    queryFn: () => fetch('/api/preview-links').then(r => r.json()),
  })

  const links: PreviewLink[] = data?.data ?? []

  const active = links.filter(l => l.status === 'ACTIVE').length
  const awaitingReview = links.filter(l => l.status === 'ACTIVE').length
  const approved = links.filter(l => l.status === 'APPROVED').length
  const revisionRequested = links.filter(l => l.status === 'REVISION_REQUESTED').length

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/preview-links/${id}`, { method: 'DELETE' }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-links'] })
      toast.success('Preview link deleted')
    },
    onError: () => toast.error('Failed to delete'),
  })

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Preview Links" description={`${links.length} total links`}>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 me-2" />
          New Preview Link
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Links" value={active} icon={<LinkIcon className="h-5 w-5" />} />
        <KPICard title="Awaiting Review" value={awaitingReview} icon={<Clock className="h-5 w-5" />} />
        <KPICard title="Approved" value={approved} icon={<CheckCircle className="h-5 w-5" />} />
        <KPICard title="Revision Requested" value={revisionRequested} icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-44 bg-muted/30 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Eye className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No preview links yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Share website previews with clients and track feedback.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 me-2" />
            Create Preview Link
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {links.map((link) => (
            <Card key={link.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">{link.title}</h3>
                  <AlertDialog>
                    <AlertDialogTrigger
                      className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete preview link?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. &ldquo;{link.title}&rdquo; will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(link.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium ${typeBadgeColors[link.type] ?? ''}`}
                  >
                    {link.type}
                  </Badge>
                  <StatusBadge status={link.status.toLowerCase().replace('_', ' ')} />
                </div>

                {/* URL */}
                <div className="flex items-center gap-2 bg-muted/40 rounded-md px-2 py-1.5">
                  <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{link.url}</span>
                  <button onClick={() => copyUrl(link.url)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" title="Copy URL">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors shrink-0" title="Open URL">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Meta */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {link.project && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">Project:</span>
                      {link.project.name}
                    </div>
                  )}
                  {link.sharedWithCompany && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">Shared with:</span>
                      {link.sharedWithCompany.displayName}
                    </div>
                  )}
                  {link.expiresAt && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Expires {format(new Date(link.expiresAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs text-muted-foreground">
                    {link._count.feedbacks} feedback{link._count.feedbacks !== 1 ? 's' : ''}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setSelectedFeedbackLink(link)}
                  >
                    <MessageSquare className="h-3.5 w-3.5 me-1" />
                    View Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PreviewLinkFormDialog open={showCreate} onOpenChange={setShowCreate} />

      {/* Feedback Panel */}
      {selectedFeedbackLink && (
        <FeedbackPanel
          link={selectedFeedbackLink}
          onClose={() => setSelectedFeedbackLink(null)}
        />
      )}
    </div>
  )
}

function FeedbackPanel({ link, onClose }: { link: PreviewLink; onClose: () => void }) {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['preview-feedback', link.id],
    queryFn: () => fetch(`/api/preview-links/${link.id}/feedback`).then(r => r.json()),
  })

  const feedbacks: Array<{ id: string; content: string; status: string; authorType: string; author?: { firstName: string; lastName: string }; createdAt: string }> = data?.data ?? []

  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/preview-links/${link.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }).then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preview-feedback', link.id] })
      queryClient.invalidateQueries({ queryKey: ['preview-links'] })
      setContent('')
      toast.success('Feedback added')
    },
    onError: () => toast.error('Failed to add feedback'),
  })

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-s shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold">Feedback</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{link.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No feedback yet.</p>
          ) : feedbacks.map(fb => (
            <div key={fb.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {fb.author ? `${fb.author.firstName} ${fb.author.lastName}` : 'Client'}
                </span>
                <Badge variant="outline" className="text-xs h-5">{fb.status}</Badge>
              </div>
              <p className="text-sm">{fb.content}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(fb.createdAt), 'MMM d, yyyy HH:mm')}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Add feedback..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-20"
          />
          <Button
            size="sm"
            className="w-full"
            disabled={!content.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Add Feedback
          </Button>
        </div>
      </div>
    </div>
  )
}
