'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { quotations } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { getInitials, formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Building2, UserCircle, DollarSign, CalendarDays, FileText } from 'lucide-react'

interface QuotationDetailProps { quotationId: string }

export function QuotationDetail({ quotationId }: QuotationDetailProps) {
  const router = useRouter()
  const quo = quotations.find(q => q.id === quotationId)

  if (!quo) {
    return (<div className="flex flex-col items-center justify-center py-16"><p className="text-lg font-medium">Quotation not found</p><Button variant="outline" className="mt-4" onClick={() => router.push('/quotations')}><ArrowLeft className="h-4 w-4 me-2" /> Back</Button></div>)
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/quotations')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{quo.title}</h1>
              <StatusBadge status={quo.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{quo.quotationNumber} · {quo.company?.name} · v{quo.version}</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Edit className="h-4 w-4 me-2" /> Edit</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div><p className="text-xs text-muted-foreground">Subtotal</p><p className="text-xl font-bold mt-1">AED {quo.subtotal.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Discount</p><p className="text-xl font-bold mt-1">AED {quo.discountAmount.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Tax</p><p className="text-xl font-bold mt-1">AED {quo.taxAmount.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold mt-1 text-blue-600">AED {quo.totalAmount.toLocaleString()}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Company" value={quo.company?.name} href={`/companies/${quo.company?.id}`} />
                <InfoRow icon={<UserCircle className="h-4 w-4" />} label="Contact" value={quo.contact?.name} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Issue Date" value={formatDate(quo.issueDate)} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Valid Until" value={quo.validUntil ? formatDate(quo.validUntil) : '-'} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Currency" value={quo.currency} />
                <InfoRow icon={<FileText className="h-4 w-4" />} label="Version" value={`v${quo.version}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Owner</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(quo.owner.name)}</AvatarFallback></Avatar>
                <div><p className="font-medium text-sm">{quo.owner.name}</p><p className="text-xs text-muted-foreground">Sales Owner</p></div>
              </div>
            </CardContent>
          </Card>
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
  return (<div className="flex items-start gap-2"><div className="text-muted-foreground mt-0.5">{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p>{href && value ? (<Link href={href} className="text-sm font-medium text-blue-600 hover:underline">{value}</Link>) : (<p className="text-sm font-medium">{value || '-'}</p>)}</div></div>)
}
