import { requirePermission } from '@/lib/auth-utils'
import { BundlesContent } from '@/components/bundles/bundles-content'

export default async function BundlesPage() {
  await requirePermission('invoices:view')
  return <BundlesContent />
}
