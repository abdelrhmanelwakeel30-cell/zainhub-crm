import { requirePermission } from '@/lib/auth-utils'
import { AccountingContent } from '@/components/admin/accounting-content'

export default async function AccountingPage() {
  await requirePermission('accounting:view')
  return <AccountingContent />
}
