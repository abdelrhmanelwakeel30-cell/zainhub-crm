import { requirePermission } from '@/lib/auth-utils'
import { ApiKeysContent } from '@/components/admin/api-keys-content'

export default async function ApiKeysPage() {
  await requirePermission('settings:view')
  return <ApiKeysContent />
}
