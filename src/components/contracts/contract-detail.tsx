'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { contracts, invoices, projects } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, Building2, CalendarDays, DollarSign, FileText,
  AlertTriangle, Receipt, FolderOpen, Clock,
} from 'lucide-react'

interface ContractDetailProps { contractId: string }

export function ContractDetail({ contractId }: ContractDetailProps) {
  const router = useRouter()
  const ctr = contracts.find(c => c.id === contractId)

  if (!ctr) {
    return (<div className="flex flex-col items-center justify-center py-16"><p className="text-lg font-medium">Contract not found</p><Button variant="outline" className="mt-4" onClick={() => router.push('/contracts')}><ArrowLeft className="h-4 w-4 me-2" /> Back</Button></div>)
  }

  const relatedInvoices = invoices.filter(inv => inv.client?.id === ctr.client.id)
  const relatedProjects = projects.filter(prj => prj.client?.id === ctr.client.id)
  const renewalDate = 'renewalDate' in ctr ? String((ctr as unknown as Record<string, string>).renewalDate) : null
  const isExpiringSoon = ctr.endDate && new Date(ctr.endDate) < new Date(Date.now() + 30 * 86400000)
  const isRenewalDue = renewalDate && new Date(renewalDate) < new Date(Date.now() + 60 * 86400000)

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contracts')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-3"><h1 className="text-2xl font-bold">{ctr.title}</h1><StatusBadge status={ctr.status} /><StatusBadge status={ctr.type} /></div>
            <p className="text-sm text-muted-foreground mt-1">{ctr.contractNumber} · {ctr.client.name} · Created {formatRelativeDate(ctr.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Receipt className="h-4 w-4 me-2" /> Create Invoice</Button>
          <Button variant="outline" size="sm"><Edit className="h-4 w-4 me-2" /> Edit</Button>
        </div>
      </div>

      {/* Renewal Warning */}
      {isRenewalDue && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Renewal Due Soon</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Renewal date: {formatDate(renewalDate)}. Contact {ctr.client.name} to initiate renewal.
            </p>
          </div>
        </div>
      )}

      {/* Expiry Warning */}
      {isExpiringSoon && !isRenewalDue && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Contract Expiring Soon</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Ends on {formatDate(ctr.endDate)}. Consider renewal or extension.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div><p className="text-xs text-muted-foreground">Value</p><p className="text-xl font-bold mt-1">{ctr.value ? `AED ${ctr.value.toLocaleString()}` : 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground">Start Date</p><p className="text-sm font-medium mt-1">{formatDate(ctr.startDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">End Date</p><p className="text-sm font-medium mt-1">{ctr.endDate ? formatDate(ctr.endDate) : 'Indefinite'}</p></div>
                <div><p className="text-xs text-muted-foreground">Signed</p><p className="text-sm font-medium mt-1">{ctr.signedAt ? formatDate(ctr.signedAt) : 'Pending'}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Client" value={ctr.client.name} link={`/companies/${ctr.client.id}`} />
                <InfoRow icon={<FileText className="h-4 w-4" />} label="Type" value={ctr.type} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Currency" value={ctr.currency} />
                {ctr.contact && <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Contact" value={ctr.contact.name} />}
                {renewalDate && <InfoRow icon={<Clock className="h-4 w-4" />} label="Renewal Date" value={formatDate(renewalDate)} />}
              </div>
            </CardContent>
          </Card>

          {/* Related Invoices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Related Invoices ({relatedInvoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedInvoices.length > 0 ? (
                <div className="space-y-3">
                  {relatedInvoices.map(inv => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">AED {inv.totalAmount.toLocaleString()} · Due {formatDate(inv.dueDate)}</p>
                      </div>
                      <StatusBadge status={inv.status} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No invoices linked to this client.</p>
              )}
            </CardContent>
          </Card>

          {/* Related Projects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4" /> Related Projects ({relatedProjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {relatedProjects.length > 0 ? (
                <div className="space-y-3">
                  {relatedProjects.map(prj => (
                    <Link key={prj.id} href={`/projects/${prj.id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium">{prj.name}</p>
                        <p className="text-xs text-muted-foreground">{prj.progressPercent}% · {prj.service}</p>
                      </div>
                      <StatusBadge status={prj.status.replace(/_/g, ' ')} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects linked to this client.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Created By</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(ctr.createdBy.name)}</AvatarFallback></Avatar>
                <div><p className="font-medium text-sm">{ctr.createdBy.name}</p><p className="text-xs text-muted-foreground">Contract Creator</p></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent>
              <StatusBadge status={ctr.status} />
              {ctr.signedAt && (
                <p className="text-xs text-muted-foreground mt-2">Signed {formatRelativeDate(ctr.signedAt)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Start</span><span className="font-medium">{formatDate(ctr.startDate)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">End</span><span className="font-medium">{ctr.endDate ? formatDate(ctr.endDate) : 'Indefinite'}</span></div>
              {renewalDate && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Renewal</span><span className="font-medium">{formatDate(renewalDate)}</span></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, link }: { icon: React.ReactNode; label: string; value?: string | null; link?: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {link ? (
          <Link href={link} className="text-sm font-medium text-blue-600 hover:underline">{value || '-'}</Link>
        ) : (
          <p className="text-sm font-medium">{value || '-'}</p>
        )}
      </div>
    </div>
  )
}
