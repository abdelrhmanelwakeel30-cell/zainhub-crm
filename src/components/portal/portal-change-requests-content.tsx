'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePortalAuth } from './portal-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { GitPullRequest, Plus, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ChangeRequest {
  id: string
  crNumber: string
  title: string
  description: string | null
  status: string
  priority: string
  type: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  IMPLEMENTED: 'bg-purple-100 text-purple-700',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

export function PortalChangeRequestsContent() {
  const { token } = usePortalAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  const { data, isLoading } = useQuery<{ success: boolean; data: ChangeRequest[] }>({
    queryKey: ['portal-change-requests'],
    queryFn: () =>
      fetch('/api/client-portal/change-requests', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string }) => {
      const res = await fetch('/api/client-portal/change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Change request submitted!')
        queryClient.invalidateQueries({ queryKey: ['portal-change-requests'] })
        setDialogOpen(false)
        setForm({ title: '', description: '' })
      } else {
        toast.error(data.error || 'Failed to submit change request.')
      }
    },
    onError: () => toast.error('Something went wrong.'),
  })

  const requests = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitPullRequest className="h-6 w-6 text-blue-600" />
            Change Requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? 'Loading...' : `${requests.length} request${requests.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Request
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !requests.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <GitPullRequest className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No change requests yet.</p>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              Submit your first request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((cr) => (
            <Card key={cr.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{cr.crNumber}</span>
                    </div>
                    <h3 className="font-medium text-sm mt-0.5 truncate">{cr.title}</h3>
                    {cr.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cr.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(cr.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[cr.status] ?? ''}`}
                    >
                      {cr.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${priorityColors[cr.priority] ?? ''}`}
                    >
                      {cr.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Change Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cr-title">Title</Label>
              <Input
                id="cr-title"
                placeholder="Briefly describe the change..."
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-desc">Description</Label>
              <Textarea
                id="cr-desc"
                placeholder="Provide more details about the change you need..."
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!form.title.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Submitting...</>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
