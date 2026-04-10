'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, Building2, CalendarDays, DollarSign, FileText,
  AlertTriangle, Receipt,
} from 'lucide-react'

interface ContractDetailProps { contractId: string }

interface Contract {
  id: string
  contractNumber: string
  title: string
  client: { displayName: string }
  type: string
  status: string
  startDate: string
  endDate: string | null
  totalValue: number | null
  currency: string
  description?: string | null
  signedDate?: string | null
  signedByClient?: boolean
}

export function ContractDetail({ contractId }: ContractDetailProps) {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', contractId],
    queryFn: () => fetch('/api/contracts/' + contractId).then(r => r.json()),
  })

  const ctr: Contract | undefined = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!ctr) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Contract not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/contracts')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back
        </Button>
      </div>
    )
  }

  const isExpiringSoon = ctr.endDate && new Date(ctr.endDate) < new Date(Date.now() + 30 * 86400000)

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contracts')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{ctr.title}</h1>
              <StatusBadge status={ctr.status} />
              <StatusBadge status={ctr.type} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{ctr.contractNumber} · {ctr.client.displayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Receipt className="h-4 w-4 me-2" /> Create Invoice</Button>
          <Button variant="outline" size="sm"><Edit className="h-4 w-4 me-2" /> Edit</Button>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpiringSoon && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Contract Expiring Soon</p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Ends on {formatDate(ctr.endDate!)}. Consider renewal or extension.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Value</p>
                  <p className="text-xl font-bold mt-1">{ctr.totalValue ? `${ctr.currency} ${ctr.totalValue.toLocaleString()}` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium mt-1">{formatDate(ctr.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-sm font-medium mt-1">{ctr.endDate ? formatDate(ctr.endDate) : 'Indefinite'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signed</p>
                  <p className="text-sm font-medium mt-1">{ctr.signedDate ? formatDate(ctr.signedDate) : 'Pending'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Client" value={ctr.client.displayName} />
                <InfoRow icon={<FileText className="h-4 w-4" />} label="Type" value={ctr.type} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Currency" value={ctr.currency} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Signed by Client" value={ctr.signedByClient ? 'Yes' : 'No'} />
              </div>
              {ctr.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{ctr.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent>
              <StatusBadge status={ctr.status} />
              {ctr.signedDate && (
                <p className="text-xs text-muted-foreground mt-2">Signed {formatRelativeDate(ctr.signedDate)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Start</span><span className="font-medium">{formatDate(ctr.startDate)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">End</span><span className="font-medium">{ctr.endDate ? formatDate(ctr.endDate) : 'Indefinite'}</span></div>
              {ctr.signedDate && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Signed</span><span className="font-medium">{formatDate(ctr.signedDate)}</span></div>}
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
