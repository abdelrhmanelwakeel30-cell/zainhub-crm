import { requirePermission } from '@/lib/auth-utils'
import { ApprovalsContent } from '@/components/approvals/approvals-content'

export default async function ApprovalsPage() {
  await requirePermission('approvals:view')
  return <ApprovalsContent />
}
