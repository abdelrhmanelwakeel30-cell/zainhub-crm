import { requirePermission } from '@/lib/auth-utils'
import { ContractDetail } from '@/components/contracts/contract-detail'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('contracts:view')
  const { id } = await params
  return <ContractDetail contractId={id} />
}
