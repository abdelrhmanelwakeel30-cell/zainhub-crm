import { requirePermission } from '@/lib/auth-utils'
import { AgentsContent } from '@/components/admin/agents-content'

export default async function AgentsPage() {
  await requirePermission('users:view')
  return <AgentsContent />
}
