import { requirePermission } from '@/lib/auth-utils'
import { AccountHealthContent } from '@/components/account-health/account-health-content'

export default async function AccountHealthPage() {
  await requirePermission('projects:view')
  return <AccountHealthContent />
}
