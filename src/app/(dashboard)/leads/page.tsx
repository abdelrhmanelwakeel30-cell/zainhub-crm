import { requirePermission } from '@/lib/auth-utils'
import { LeadsContent } from '@/components/leads/leads-content'

export default async function LeadsPage() {
  await requirePermission('leads:view')
  return <LeadsContent />
}
