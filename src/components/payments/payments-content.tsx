'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/shared/page-header'
import { KPICard } from '@/components/shared/kpi-card'
import { PaymentsTable } from './payments-table'
import { Button } from '@/components/ui/button'
import { Plus, Download, CreditCard, DollarSign, TrendingUp } from 'lucide-react'

interface Payment {
  id: string
  paymentNumber: string
  amount: number
  currency: string
  method: string
  paymentDate: string
  invoice: {
    invoiceNumber: string
    client: { displayName: string }
  } | null
  recordedBy: { firstName: string; lastName: string } | null
}

interface PaymentsApiResponse {
  success: boolean
  data: Payment[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function PaymentsContent() {
  const { data: response } = useQuery<PaymentsApiResponse>({
    queryKey: ['payments'],
    queryFn: () => fetch('/api/payments').then(r => r.json()),
  })

  const payments = response?.data ?? []

  const totalReceived = payments.reduce((s, p) => s + (p.amount ?? 0), 0)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  const thisMonthCount = payments.filter(p => new Date(p.paymentDate) > thirtyDaysAgo).length

  return (
    <div className="space-y-6 animate-slide-in">
      <PageHeader title="Payments" description={`${payments.length} payments recorded`}>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 me-2" /> Export</Button>
        <Button size="sm"><Plus className="h-4 w-4 me-2" /> Record Payment</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Total Payments" value={payments.length} icon={<CreditCard className="h-5 w-5" />} />
        <KPICard title="Total Received" value={`${(totalReceived / 1000).toFixed(0)}K`} prefix="AED " icon={<DollarSign className="h-5 w-5" />} />
        <KPICard title="This Month" value={thisMonthCount} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <PaymentsTable />
    </div>
  )
}
