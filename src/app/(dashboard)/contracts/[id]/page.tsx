import { ContractDetail } from '@/components/contracts/contract-detail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContractDetail contractId={id} />
}
