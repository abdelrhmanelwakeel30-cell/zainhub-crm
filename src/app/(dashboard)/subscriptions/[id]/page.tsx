import { requirePermission } from '@/lib/auth-utils'
import { SubscriptionDetail } from '@/components/subscriptions/subscription-detail'

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('invoices:view')
  const { id } = await params
  return <SubscriptionDetail subscriptionId={id} />
}
