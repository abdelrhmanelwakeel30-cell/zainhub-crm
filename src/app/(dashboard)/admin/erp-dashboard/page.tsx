import { requirePermission } from '@/lib/auth-utils'
import { ErpDashboardContent } from '@/components/admin/erp-dashboard-content'

export default async function ErpDashboardPage() {
  await requirePermission('reports:view')
  return <ErpDashboardContent />
}
