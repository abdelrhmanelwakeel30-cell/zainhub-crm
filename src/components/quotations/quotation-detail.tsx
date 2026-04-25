'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Building2, UserCircle, DollarSign, CalendarDays, FileText, Download } from 'lucide-react'

interface QuotationDetailProps { quotationId: string }

type QuotationDetail = {
  id: string
  quotationNumber: string
  title: string
  company?: { id: string; displayName: string }
  totalAmount: number
  status: string
  issueDate: string
  validUntil?: string | null
  currency: string
  items?: { description: string; quantity: number; unitPrice: number; totalPrice: number }[]
  notes?: string | null
  terms?: string | null
  subtotal?: number
  discountAmount?: number
  taxAmount?: number
  version?: number
  opportunity?: { id: string; title: string }
  contact?: { id: string; firstName: string; lastName: string }
}

export function QuotationDetail({ quotationId }: QuotationDetailProps) {
  const router = useRouter()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['quotations', quotationId],
    queryFn: () => fetch('/api/quotations/' + quotationId).then(r => r.json()),
  })

  const quo: QuotationDetail | undefined = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to quotations" onClick={() => router.push('/quotations')}>
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

  if (isError || !quo) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Quotation not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/quotations')}>
          <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" /> Back
        </Button>
      </div>
    )
  }

  const contactName = quo.contact ? `${quo.contact.firstName} ${quo.contact.lastName}` : null

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to quotations" onClick={() => router.push('/quotations')}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quo.title}</h1>
              <StatusBadge status={quo.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {quo.quotationNumber} · {quo.company?.displayName}{quo.version != null ? ` · v${quo.version}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/pdf/quotation/${quotationId}`}
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Subtotal</p>
                  <p className="text-xl font-bold mt-1">{quo.currency} {(quo.subtotal ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Discount</p>
                  <p className="text-xl font-bold mt-1">{quo.currency} {(quo.discountAmount ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tax</p>
                  <p className="text-xl font-bold mt-1">{quo.currency} {(quo.taxAmount ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold mt-1 text-blue-600">{quo.currency} {quo.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Client" value={quo.company?.displayName} href={quo.company ? `/companies/${quo.company.id}` : undefined} />
                <InfoRow icon={<UserCircle className="h-4 w-4" />} label="Contact" value={contactName} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Issue Date" value={formatDate(quo.issueDate)} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Expiry Date" value={quo.validUntil ? formatDate(quo.validUntil) : '-'} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Currency" value={quo.currency} />
                {quo.version != null && <InfoRow icon={<FileText className="h-4 w-4" />} label="Version" value={`v${quo.version}`} />}
              </div>
            </CardContent>
          </Card>

          {quo.items && quo.items.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quo.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {quo.currency} {item.unitPrice.toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-semibold">{quo.currency} {item.totalPrice.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(quo.notes || quo.terms) && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {quo.notes && <div><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm">{quo.notes}</p></div>}
                {quo.terms && <div><p className="text-xs text-muted-foreground mb-1">Terms</p><p className="text-sm">{quo.terms}</p></div>}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {quo.opportunity && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Linked Opportunity</CardTitle></CardHeader>
              <CardContent>
                <Link href={`/opportunities/${quo.opportunity.id}`} className="text-sm text-blue-600 hover:underline font-medium">{quo.opportunity.title}</Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string | null; href?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {href && value ? (
          <Link href={href} className="text-sm font-medium text-blue-600 hover:underline">{value}</Link>
        ) : (
          <p className="text-sm font-medium">{value || '-'}</p>
        )}
      </div>
    </div>
  )
}
