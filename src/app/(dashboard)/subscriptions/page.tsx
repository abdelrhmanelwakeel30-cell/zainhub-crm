import { requirePermission } from '@/lib/auth-utils'
import { SubscriptionsContent } from '@/components/subscriptions/subscriptions-content'

export default async function SubscriptionsPage() {
  await requirePermission('invoices:view')
  return <SubscriptionsContent />
}
