import { requirePermission } from '@/lib/auth-utils'
import { UsersContent } from '@/components/admin/users-content'

export default async function UsersPage() {
  await requirePermission('users:view')
  return <UsersContent />
}
