'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Building2, UserCircle, CalendarDays, DollarSign, Download } from 'lucide-react'

interface ProposalDetailProps { proposalId: string }

type ProposalDetail = {
  id: string
  proposalNumber: string
  title: string
  company?: { id: string; displayName: string }
  totalAmount: number
  status: string
  createdAt: string
  validUntil?: string | null
  subtotal?: number
  currency?: string
  version?: number
  opportunity?: { id: string; title: string }
  contact?: { id: string; firstName: string; lastName: string }
  items?: { description: string; quantity: number; unitPrice: number; totalPrice: number }[]
  notes?: string | null
  terms?: string | null
}

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['proposals', proposalId],
    queryFn: () => fetch('/api/proposals/' + proposalId).then(r => r.json()),
  })

  const prp: ProposalDetail | undefined = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to proposals" onClick={() => router.push('/proposals')}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !prp) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Proposal not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/proposals')}>
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" /> Back
        </Button>
      </div>
    )
  }

  const currency = prp.currency ?? 'AED'
  const contactName = prp.contact ? `${prp.contact.firstName} ${prp.contact.lastName}` : null

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to proposals" onClick={() => router.push('/proposals')}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{prp.title}</h1>
              <StatusBadge status={prp.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {prp.proposalNumber} · {prp.company?.displayName}{prp.version != null ? ` · v${prp.version}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/pdf/proposal/${proposalId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5 text-[0.8rem] font-medium transition-all"
          >
            <Download className="h-3.5 w-3.5 me-2" /> Download PDF
          </a>
          <Button variant="outline" size="sm"><Edit className="h-4 w-4 me-2" /> Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-xl font-bold mt-1">{currency} {(prp.subtotal ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold mt-1 text-blue-600">{currency} {prp.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Currency</p>
                  <p className="text-xl font-bold mt-1">{currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <div className="text-muted-foreground mt-0.5"><Building2 className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    {prp.company ? (
                      <Link href={`/companies/${prp.company.id}`} className="text-sm font-medium text-blue-600 hover:underline">{prp.company.displayName}</Link>
                    ) : (
                      <p className="text-sm font-medium">-</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-muted-foreground mt-0.5"><UserCircle className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{contactName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-muted-foreground mt-0.5"><CalendarDays className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{formatDate(prp.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-muted-foreground mt-0.5"><CalendarDays className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expiry Date</p>
                    <p className="text-sm font-medium">{prp.validUntil ? formatDate(prp.validUntil) : '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {prp.items && prp.items.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prp.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {currency} {item.unitPrice.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-semibold">{currency} {item.totalPrice.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(prp.notes || prp.terms) && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {prp.notes && <div><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{prp.notes}</p></div>}
                {prp.terms && <div><p className="text-xs text-muted-foreground mb-1">Terms</p><p className="text-sm">{prp.terms}</p></div>}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {prp.opportunity && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Linked Opportunity</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/opportunities/${prp.opportunity.id}`} className="text-sm text-blue-600 hover:underline font-medium">{prp.opportunity.title}</Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent><StatusBadge status={prp.status} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
