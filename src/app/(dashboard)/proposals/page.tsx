import { requirePermission } from '@/lib/auth-utils'
import { ProposalsContent } from '@/components/proposals/proposals-content'

export default async function ProposalsPage() {
  await requirePermission('proposals:view')
  return <ProposalsContent />
}
