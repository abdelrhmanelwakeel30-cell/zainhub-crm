import { requirePermission } from '@/lib/auth-utils'
import { ContractsContent } from '@/components/contracts/contracts-content'

export default async function ContractsPage() {
  await requirePermission('contracts:view')
  return <ContractsContent />
}
