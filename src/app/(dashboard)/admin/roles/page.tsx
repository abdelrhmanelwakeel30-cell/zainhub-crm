import { requirePermission } from '@/lib/auth-utils'
import { RolesContent } from '@/components/admin/roles-content'

export default async function RolesPage() {
  await requirePermission('roles:view')
  return <RolesContent />
}
