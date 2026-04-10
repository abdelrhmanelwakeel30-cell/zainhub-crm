import { requirePermission } from '@/lib/auth-utils'
import { PaymentsContent } from '@/components/payments/payments-content'

export default async function PaymentsPage() {
  await requirePermission('payments:view')
  return <PaymentsContent />
}
