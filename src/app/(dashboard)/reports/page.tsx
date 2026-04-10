import { requirePermission } from '@/lib/auth-utils'
import { ReportsContent } from '@/components/reports/reports-content'

export default async function ReportsPage() {
  await requirePermission('reports:view')
  return <ReportsContent />
}
