import { requirePermission } from '@/lib/auth-utils'
import { ApprovalDetail } from '@/components/approvals/approval-detail'

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('approvals:view')
  const { id } = await params
  return <ApprovalDetail id={id} />
}
