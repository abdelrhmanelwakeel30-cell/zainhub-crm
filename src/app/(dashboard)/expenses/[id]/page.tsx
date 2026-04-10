import { requirePermission } from '@/lib/auth-utils'
import { ExpenseDetail } from '@/components/expenses/expense-detail'

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('expenses:view')
  const { id } = await params
  return <ExpenseDetail expenseId={id} />
}
