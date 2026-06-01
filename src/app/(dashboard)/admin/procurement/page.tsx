import { requirePermission } from '@/lib/auth-utils'
import { ProcurementContent } from '@/components/admin/procurement-content'

export default async function ProcurementPage() {
  await requirePermission('procurement:view')
  return <ProcurementContent />
}
