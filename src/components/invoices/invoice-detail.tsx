'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { invoices, payments } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, Building2, Briefcase, DollarSign,
  CalendarDays, CreditCard, FileText
} from 'lucide-react'

interface InvoiceDetailProps {
  invoiceId: string
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const t = useTranslations('invoices')
  const tc = useTranslations('common')
  const router = useRouter()

  const invoice = invoices.find(inv => inv.id === invoiceId)

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

  const invoicePayments = payments.filter(p => p.invoice.id === invoice.id)

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.client.name} · {invoice.project.name} · Created {formatRelativeDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                  <p className="text-xl font-bold mt-1">AED {invoice.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('paidAmount')}</p>
                  <p className="text-xl font-bold mt-1 text-green-600">AED {invoice.amountPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('balanceDue')}</p>
                  <p className={`text-xl font-bold mt-1 ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    AED {invoice.balanceDue.toLocaleString()}
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
                      {invoice.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{item.description}</TableCell>
                          <TableCell className="text-sm text-end">{item.quantity}</TableCell>
                          <TableCell className="text-sm text-end">AED {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-sm font-medium text-end">AED {item.totalPrice.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2">
                        <TableCell colSpan={3} className="text-sm font-medium text-end">Subtotal</TableCell>
                        <TableCell className="text-sm font-medium text-end">AED {invoice.subtotal.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-sm text-muted-foreground text-end">Tax (5%)</TableCell>
                        <TableCell className="text-sm text-muted-foreground text-end">AED {invoice.taxAmount.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={3} className="text-sm font-bold text-end">Total</TableCell>
                        <TableCell className="text-sm font-bold text-end">AED {invoice.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardContent className="p-6">
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
                                {payment.paymentMethod.replace('_', ' ')} · {payment.reference}
                              </p>
                            </div>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-semibold text-green-600">AED {payment.amount.toLocaleString()}</p>
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
                      { action: 'Invoice created', detail: `${invoice.invoiceNumber} · AED ${invoice.totalAmount.toLocaleString()}`, time: invoice.createdAt },
                      ...(invoice.status === 'SENT' || invoice.status === 'PAID' || invoice.status === 'OVERDUE'
                        ? [{ action: 'Invoice sent to client', detail: `Sent to ${invoice.client.name}`, time: invoice.issueDate }]
                        : []),
                      ...invoicePayments.map(p => ({
                        action: 'Payment received',
                        detail: `AED ${p.amount.toLocaleString()} via ${p.paymentMethod.replace('_', ' ')}`,
                        time: p.paymentDate,
                      })),
                      ...(invoice.status === 'PAID'
                        ? [{ action: 'Invoice fully paid', detail: `Balance cleared`, time: invoicePayments[invoicePayments.length - 1]?.paymentDate || invoice.createdAt }]
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
                  <Link href={`/companies/${invoice.client.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                    {invoice.client.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Client</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('project')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <Link href={`/projects/${invoice.project.id}`} className="font-medium text-sm text-blue-600 hover:underline">
                    {invoice.project.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">Linked Project</p>
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
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created By</span>
                <span className="text-sm font-medium">{invoice.createdBy.name}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
