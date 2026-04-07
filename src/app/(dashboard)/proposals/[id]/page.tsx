import { ProposalDetail } from '@/components/proposals/proposal-detail'

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProposalDetail proposalId={id} />
}
