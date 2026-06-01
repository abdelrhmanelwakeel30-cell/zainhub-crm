import { requirePermission } from '@/lib/auth-utils'
import { BudgetingContent } from '@/components/admin/budgeting-content'

export default async function BudgetingPage() {
  await requirePermission('budgeting:view')
  return <BudgetingContent />
}
