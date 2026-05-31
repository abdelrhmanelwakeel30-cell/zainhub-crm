import { requirePermission } from '@/lib/auth-utils'
import { HRContent } from '@/components/admin/hr-content'

export default async function HRPage() {
  await requirePermission('employees:view')
  return <HRContent />
}
