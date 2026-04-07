'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { proposals } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Edit, Building2, UserCircle, CalendarDays, DollarSign } from 'lucide-react'

interface ProposalDetailProps { proposalId: string }

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const router = useRouter()
  const prp = proposals.find(p => p.id === proposalId)

  if (!prp) {
    return (<div className="flex flex-col items-center justify-center py-16"><p className="text-lg font-medium">Proposal not found</p><Button variant="outline" className="mt-4" onClick={() => router.push('/proposals')}><ArrowLeft className="h-4 w-4 me-2" /> Back</Button></div>)
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/proposals')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{prp.title}</h1><StatusBadge status={prp.status} /></div>
            <p className="text-sm text-muted-foreground mt-1">{prp.proposalNumber} · {prp.company?.name} · v{prp.version}</p>
          </div>
        </div>
        <Button variant="outline" size="sm"><Edit className="h-4 w-4 me-2" /> Edit</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div><p className="text-xs text-muted-foreground">Subtotal</p><p className="text-xl font-bold mt-1">AED {prp.subtotal.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold mt-1 text-blue-600">AED {prp.totalAmount.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Currency</p><p className="text-xl font-bold mt-1">{prp.currency}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2"><div className="text-muted-foreground mt-0.5"><Building2 className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Company</p>{prp.company ? <Link href={`/companies/${prp.company.id}`} className="text-sm font-medium text-blue-600 hover:underline">{prp.company.name}</Link> : <p className="text-sm font-medium">-</p>}</div></div>
                <div className="flex items-start gap-2"><div className="text-muted-foreground mt-0.5"><UserCircle className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Contact</p><p className="text-sm font-medium">{prp.contact?.name || '-'}</p></div></div>
                <div className="flex items-start gap-2"><div className="text-muted-foreground mt-0.5"><CalendarDays className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Issue Date</p><p className="text-sm font-medium">{formatDate(prp.issueDate)}</p></div></div>
                <div className="flex items-start gap-2"><div className="text-muted-foreground mt-0.5"><CalendarDays className="h-4 w-4" /></div><div><p className="text-xs text-muted-foreground">Valid Until</p><p className="text-sm font-medium">{prp.validUntil ? formatDate(prp.validUntil) : '-'}</p></div></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {prp.opportunity && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Linked Opportunity</CardTitle></CardHeader>
              <CardContent><Link href={`/opportunities/${prp.opportunity.id}`} className="text-sm text-blue-600 hover:underline font-medium">{prp.opportunity.title}</Link></CardContent>
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
