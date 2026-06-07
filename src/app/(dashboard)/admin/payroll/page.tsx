import { requirePermission } from '@/lib/auth-utils'
import { PayrollContent } from '@/components/admin/payroll-content'

export default async function PayrollPage() {
  await requirePermission('payroll:view')
  return <PayrollContent />
}
