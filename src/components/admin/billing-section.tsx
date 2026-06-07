'use client'

import { useTranslations } from 'next-intl'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2 } from 'lucide-react'

type Billing = { plan: string; subscriptionStatus: string | null; hasCustomer: boolean; configured: boolean }

export function BillingSection() {
  const t = useTranslations('admin')

  const { data } = useQuery({
    queryKey: ['admin', 'billing'],
    queryFn: () => fetch('/api/billing').then((r) => r.json()),
  })
  const billing: Billing = data?.data ?? { plan: 'PROFESSIONAL', subscriptionStatus: null, hasCustomer: false, configured: false }

  const checkout = useMutation({
    mutationFn: (plan: string) =>
      fetch('/api/billing/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan }) }).then(async (r) => {
        if (!r.ok) throw new Error('failed')
        return r.json()
      }),
    onSuccess: (r) => {
      if (r.data?.configured && r.data?.url) {
        window.location.href = r.data.url
      } else {
        toast.info(t('billingNotConfigured'))
      }
    },
    onError: () => toast.error(t('billingCheckoutFailed')),
  })

  const statusColor = billing.subscriptionStatus === 'active'
    ? 'text-emerald-600'
    : billing.subscriptionStatus === 'past_due' || billing.subscriptionStatus === 'canceled'
      ? 'text-rose-600'
      : 'text-muted-foreground'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{t('billing')}</CardTitle>
            <CardDescription>{t('billingDesc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3.5">
          <div>
            <p className="text-sm font-medium">{t('currentPlan')}</p>
            <p className="text-xs text-muted-foreground">
              {billing.plan}
              {billing.subscriptionStatus && (
                <> · <span className={statusColor}>{billing.subscriptionStatus}</span></>
              )}
            </p>
          </div>
          <Button size="sm" onClick={() => checkout.mutate(billing.plan)} disabled={checkout.isPending}>
            {checkout.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {t('upgradePlan')}
          </Button>
        </div>
        {!billing.configured && (
          <p className="text-xs text-amber-600">{t('billingNotConfigured')}</p>
        )}
      </CardContent>
    </Card>
  )
}
