import { requirePermission } from '@/lib/auth-utils'
import { QuotationsContent } from '@/components/quotations/quotations-content'

export default async function QuotationsPage() {
  await requirePermission('quotations:view')
  return <QuotationsContent />
}
