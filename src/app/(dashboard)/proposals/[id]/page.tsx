import { requirePermission } from '@/lib/auth-utils'
import { ProposalDetail } from '@/components/proposals/proposal-detail'

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('proposals:view')
  const { id } = await params
  return <ProposalDetail proposalId={id} />
}
