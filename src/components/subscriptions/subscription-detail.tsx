'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Building2, RefreshCw, Receipt, PauseCircle, XCircle, PlayCircle
} from 'lucide-react'

interface BillingRecord {
  id: string
  billingDate: string
  amount: number
  currency: string
  status: string
  notes: string | null
  invoice: { id: string; invoiceNumber: string; status: string } | null
}

interface Subscription {
  id: string
  name: string
  description: string | null
  company: { id: string; displayName: string }
  service: { id: string; name: string } | null
  package: { id: string; name: string } | null
  contact: { id: string; firstName: string; lastName: string } | null
  assignedTo: { id: string; name: string } | null
  amount: number
  currency: string
  interval: string
  startDate: string
  nextBillingDate: string
  endDate: string | null
  status: string
  autoRenew: boolean
  notes: string | null
  billingHistory: BillingRecord[]
}

const INTERVAL_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly', BIWEEKLY: 'Bi-weekly', MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly', SEMI_ANNUAL: 'Semi-Annual', ANNUAL: 'Annual',
}

interface SubscriptionDetailProps {
  subscriptionId: string
}

export function SubscriptionDetail({ subscriptionId }: SubscriptionDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', subscriptionId],
    queryFn: () => fetch(`/api/subscriptions/${subscriptionId}`).then(r => r.json()),
  })

  const subscription: Subscription | undefined = data?.data

  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Subscription updated')
    },
    onError: () => toast.error('Failed to update subscription'),
  })

  const generateBillingMutation = useMutation({
    mutationFn: (createInvoice: boolean) =>
      fetch(`/api/subscriptions/${subscriptionId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ createInvoice }),
      }).then(r => r.json()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', subscriptionId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      if (result.data?.invoice) {
        toast.success(`Invoice ${result.data.invoice.invoiceNumber} created`)
      } else {
        toast.success('Billing record created')
      }
    },
    onError: () => toast.error('Failed to generate billing record'),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Subscription not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/subscriptions')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Subscriptions
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to subscriptions" onClick={() => router.push('/subscriptions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{subscription.name}</h1>
              <StatusBadge status={subscription.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {subscription.company.displayName} · {INTERVAL_LABELS[subscription.interval]} · {subscription.currency} {subscription.amount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subscription.status === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate('PAUSED')}
                disabled={statusMutation.isPending}
              >
                <PauseCircle className="h-4 w-4 me-2" /> Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => statusMutation.mutate('CANCELLED')}
                disabled={statusMutation.isPending}
              >
                <XCircle className="h-4 w-4 me-2" /> Cancel
              </Button>
            </>
          )}
          {subscription.status === 'PAUSED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => statusMutation.mutate('ACTIVE')}
              disabled={statusMutation.isPending}
            >
              <PlayCircle className="h-4 w-4 me-2" /> Resume
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => generateBillingMutation.mutate(true)}
            disabled={generateBillingMutation.isPending}
          >
            <Receipt className="h-4 w-4 me-2" /> Generate Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold mt-1">{subscription.currency} {subscription.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Interval</p>
                  <p className="text-sm font-medium mt-1">{INTERVAL_LABELS[subscription.interval]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium mt-1">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Next Billing</p>
                  <p className="text-sm font-medium mt-1">{formatDate(subscription.nextBillingDate)}</p>
                </div>
                {subscription.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="text-sm font-medium mt-1">{formatDate(subscription.endDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Auto Renew</p>
                  <p className={`text-sm font-medium mt-1 ${subscription.autoRenew ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {subscription.autoRenew ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              {subscription.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{subscription.description}</p>
                </div>
              )}
              {subscription.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{subscription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Billing History</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateBillingMutation.mutate(false)}
                disabled={generateBillingMutation.isPending}
              >
                <RefreshCw className="h-3 w-3 me-1" /> Add Record
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {subscription.billingHistory.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8" />
                  <p className="text-sm">No billing records yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Billing Date</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscription.billingHistory.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm">{formatDate(record.billingDate)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          {record.currency} {record.amount.toLocaleString()}
                        </TableCell>
                        <TableCell><StatusBadge status={record.status} /></TableCell>
                        <TableCell>
                          {record.invoice ? (
                            <span className="text-xs font-mono text-blue-600">{record.invoice.invoiceNumber}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="font-medium text-sm">{subscription.company.displayName}</p>
              </div>
            </CardContent>
          </Card>

          {(subscription.service || subscription.package) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subscription.service && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Service</span>
                    <span className="text-sm font-medium">{subscription.service.name}</span>
                  </div>
                )}
                {subscription.package && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Package</span>
                    <span className="text-sm font-medium">{subscription.package.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {subscription.contact && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">
                  {subscription.contact.firstName} {subscription.contact.lastName}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
