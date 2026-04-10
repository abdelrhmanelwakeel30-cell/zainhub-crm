import { requirePermission } from '@/lib/auth-utils'
import { ChangeRequestsContent } from '@/components/change-requests/change-requests-content'

export default async function ChangeRequestsPage() {
  await requirePermission('change_requests:view')
  return <ChangeRequestsContent />
}
