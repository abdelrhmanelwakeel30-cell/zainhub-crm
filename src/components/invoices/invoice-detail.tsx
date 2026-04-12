'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, Building2, DollarSign,
  CalendarDays, CreditCard, FileText, Download
} from 'lucide-react'

interface InvoiceDetailProps {
  invoiceId: string
}

interface InvoiceItem {
  id: string
  service: { name: string }
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  discountPercent: number
  totalPrice: number
}

interface Payment {
  id: string
  paymentNumber: string
  amount: number
  paymentMethod: string
  paymentDate: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  client: { displayName: string; taxRegistrationNumber?: string }
  issueDate: string
  dueDate: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  status: string
  currency: string
  taxRate?: { name: string; rate: number }
  items: InvoiceItem[]
  payments: Payment[]
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const t = useTranslations('invoices')
  const tc = useTranslations('common')
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: () => fetch('/api/invoices/' + invoiceId).then(r => r.json()),
  })

  const invoice: Invoice | undefined = data?.data

  const recordPaymentMutation = useMutation({
    mutationFn: (body: { amount: number; paymentMethod: string; paymentDate: string; reference?: string; notes?: string }) =>
      fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
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

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Invoices
        </Button>
      </div>
    )
  }

  const invoicePayments = invoice.payments ?? []

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Back to invoices" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.client.displayName} · Created {formatRelativeDate(invoice.issueDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/pdf/invoice/${invoiceId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5 text-[0.8rem] font-medium transition-all"
          >
            <Download className="h-3.5 w-3.5 me-2" /> Download PDF
          </a>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 me-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t('totalAmount')}</p>
                  <p className="text-xl font-bold mt-1">{invoice.currency} {invoice.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('paidAmount')}</p>
                  <p className="text-xl font-bold mt-1 text-green-600">{invoice.currency} {invoice.amountPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('balanceDue')}</p>
                  <p className={`text-xl font-bold mt-1 ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {invoice.currency} {invoice.balanceDue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('dueDate')}</p>
                  <p className="text-sm font-medium mt-1">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="items">
            <TabsList>
              <TabsTrigger value="items">{t('lineItems')}</TabsTrigger>
              <TabsTrigger value="payments">{t('payments')}</TabsTrigger>
              <TabsTrigger value="timeline">{tc('timeline')}</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-medium">{t('description')}</TableHead>
                        <TableHead className="text-xs font-medium text-end">{t('quantity')}</TableHead>
                        <TableHead className="text-xs font-medium text-end">{t('unitPrice')}</TableHead>
                        <TableHead className="text-xs font-medium text-end">{t('totalAmount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(invoice.items ?? []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">
                            <p className="font-medium">{item.service?.name}</p>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </TableCell>
                          <TableCell className="text-sm text-end">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-end">{invoice.currency} {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-sm font-medium text-end">{invoice.currency} {item.totalPrice.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell colSpan={3} className="text-sm font-bold text-end">Total</TableCell>
                        <TableCell className="text-sm font-bold text-end">{invoice.currency} {invoice.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {invoice.balanceDue > 0 && (
                    <div className="mb-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Record payment with balance due as default amount
                          recordPaymentMutation.mutate({
                            amount: invoice.balanceDue,
                            paymentMethod: 'BANK_TRANSFER',
                            paymentDate: new Date().toISOString().split('T')[0],
                          })
                        }}
                        disabled={recordPaymentMutation.isPending}
                      >
                        <CreditCard className="h-4 w-4 me-2" /> Record Payment
                      </Button>
                    </div>
                  )}
                  {invoicePayments.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <CreditCard className="h-8 w-8" />
                      <p className="text-sm">No payments recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {invoicePayments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400">
                              <CreditCard className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{payment.paymentNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {payment.paymentMethod.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-semibold text-green-600">{invoice.currency} {payment.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[
                      { action: 'Invoice created', detail: `${invoice.invoiceNumber} · ${invoice.currency} ${invoice.totalAmount.toLocaleString()}`, time: invoice.issueDate },
                      ...(invoice.status === 'SENT' || invoice.status === 'PAID' || invoice.status === 'OVERDUE'
                        ? [{ action: 'Invoice sent to client', detail: `Sent to ${invoice.client.displayName}`, time: invoice.issueDate }]
                        : []),
                      ...invoicePayments.map(p => ({
                        action: 'Payment received',
                        detail: `${invoice.currency} ${p.amount.toLocaleString()} via ${p.paymentMethod.replace(/_/g, ' ')}`,
                        time: p.paymentDate,
                      })),
                      ...(invoice.status === 'PAID'
                        ? [{ action: 'Invoice fully paid', detail: `Balance cleared`, time: invoicePayments[invoicePayments.length - 1]?.paymentDate || invoice.issueDate }]
                        : []),
                    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((event, i, arr) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                          {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium">{event.action}</p>
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatRelativeDate(event.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('client')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{invoice.client.displayName}</p>
                  {invoice.client.taxRegistrationNumber && (
                    <p className="text-xs text-muted-foreground">TRN: {invoice.client.taxRegistrationNumber}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('status')}</span>
                <StatusBadge status={invoice.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('issueDate')}</span>
                <span className="text-sm font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('dueDate')}</span>
                <span className="text-sm font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Currency</span>
                <span className="text-sm font-medium">{invoice.currency}</span>
              </div>
              {invoice.taxRate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax Rate</span>
                  <span className="text-sm font-medium">{invoice.taxRate.name} ({invoice.taxRate.rate}%)</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
