import { requirePermission } from '@/lib/auth-utils'
import { DeliverablesContent } from '@/components/deliverables/deliverables-content'

export default async function DeliverablesPage() {
  await requirePermission('deliverables:view')
  return <DeliverablesContent />
}
