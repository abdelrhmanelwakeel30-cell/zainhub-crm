import { requirePermission } from '@/lib/auth-utils'
import { ExpensesContent } from '@/components/expenses/expenses-content'

export default async function ExpensesPage() {
  await requirePermission('expenses:view')
  return <ExpensesContent />
}
