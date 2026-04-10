'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface Submission {
  id: string
  data: string
  createdAt: string
  ipAddress: string | null
  lead: { id: string; fullName: string; leadNumber: string } | null
}

interface FormSubmissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formId: string
  formName: string
}

export function FormSubmissionsDialog({ open, onOpenChange, formId, formName }: FormSubmissionsDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: () => fetch(`/api/forms/${formId}/submissions`).then(r => r.json()),
    enabled: open,
  })

  const submissions: Submission[] = data?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submissions — {formName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No submissions yet. Share your form to start collecting leads.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{data?.total} total submissions</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Submitted Data</TableHead>
                  <TableHead className="text-xs">Lead Created</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map(sub => {
                  let parsed: Record<string, string> = {}
                  try { parsed = JSON.parse(sub.data) } catch { /* empty */ }

                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(sub.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {Object.entries(parsed).map(([key, val]) => (
                            <div key={key} className="text-xs">
                              <span className="text-muted-foreground">{key}: </span>
                              <span className="font-medium">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sub.lead ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono text-blue-600">{sub.lead.leadNumber}</span>
                            <span className="text-xs">{sub.lead.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {sub.ipAddress ?? '—'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
