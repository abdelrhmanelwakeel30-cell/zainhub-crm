'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { expenses } from '@/lib/demo-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { getInitials, formatDate, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Edit, Store, Tag, DollarSign,
  CalendarDays, CreditCard, FolderKanban, CheckCircle, XCircle
} from 'lucide-react'

interface ExpenseDetailProps {
  expenseId: string
}

export function ExpenseDetail({ expenseId }: ExpenseDetailProps) {
  const t = useTranslations('expenses')
  const tc = useTranslations('common')
  const router = useRouter()

  const expense = expenses.find(e => e.id === expenseId)

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Expense not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/expenses')}>
          <ArrowLeft className="h-4 w-4 me-2" /> Back to Expenses
        </Button>
      </div>
    )
  }

  const isPending = expense.status === 'PENDING'

  const paymentMethodLabels: Record<string, string> = {
    CREDIT_CARD: 'Credit Card',
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
    PETTY_CASH: 'Petty Cash',
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/expenses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{expense.vendorName}</h1>
              <StatusBadge status={expense.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {expense.expenseNumber} · {expense.category.name} · Created {formatRelativeDate(expense.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle className="h-4 w-4 me-2" /> Approve
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="h-4 w-4 me-2" /> Reject
              </Button>
            </>
          )}
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 me-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t('amount')}</p>
                  <p className="text-xl font-bold mt-1">AED {expense.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('tax')}</p>
                  <p className="text-xl font-bold mt-1">AED {expense.taxAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('totalAmount')}</p>
                  <p className="text-xl font-bold mt-1">AED {expense.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('expenseDate')}</p>
                  <p className="text-sm font-medium mt-1">{formatDate(expense.expenseDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow icon={<Store className="h-4 w-4" />} label={t('vendor')} value={expense.vendorName} />
                <InfoRow icon={<Tag className="h-4 w-4" />} label={t('category')} value={expense.category.name} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label={t('amount')} value={`AED ${expense.totalAmount.toLocaleString()}`} />
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={t('expenseDate')} value={formatDate(expense.expenseDate)} />
                <InfoRow icon={<CreditCard className="h-4 w-4" />} label={t('paymentMethod')} value={paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod} />
                <InfoRow
                  icon={<FolderKanban className="h-4 w-4" />}
                  label={t('project')}
                  value={expense.project?.name}
                  href={expense.project ? `/projects/${expense.project.id}` : undefined}
                />
              </div>
              {expense.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">{t('description')}</p>
                  <p className="text-sm">{expense.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Section */}
          {isPending && (
            <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-yellow-800 dark:text-yellow-300">{t('pendingApproval')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">
                  This expense is pending approval. Review the details and approve or reject.
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="h-4 w-4 me-2" /> Approve Expense
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                    <XCircle className="h-4 w-4 me-2" /> Reject Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Expense created', detail: `${expense.vendorName} · AED ${expense.totalAmount.toLocaleString()}`, time: expense.createdAt },
                  ...(expense.status === 'APPROVED' ? [{ action: 'Expense approved', detail: `Approved for AED ${expense.totalAmount.toLocaleString()}`, time: expense.createdAt }] : []),
                  ...(expense.status === 'PAID' ? [
                    { action: 'Expense approved', detail: `Approved for AED ${expense.totalAmount.toLocaleString()}`, time: expense.createdAt },
                    { action: 'Payment processed', detail: `Paid via ${paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}`, time: expense.createdAt },
                  ] : []),
                ].reverse().map((event, i, arr) => (
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Created By */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('createdBy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(expense.createdBy.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{expense.createdBy.name}</p>
                  <p className="text-xs text-muted-foreground">Submitted by</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={expense.status} />
            </CardContent>
          </Card>

          {/* Expense Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('amount')}</span>
                <span className="text-sm font-semibold">AED {expense.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('tax')}</span>
                <span className="text-sm font-semibold">AED {expense.taxAmount.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-medium">{t('totalAmount')}</span>
                <span className="text-sm font-bold">AED {expense.totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Project */}
          {expense.project && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('project')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/projects/${expense.project.id}`}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  {expense.project.name}
                </Link>
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
