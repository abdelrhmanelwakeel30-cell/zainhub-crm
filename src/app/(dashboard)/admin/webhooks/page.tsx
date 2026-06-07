import { requirePermission } from '@/lib/auth-utils'
import { WebhooksContent } from '@/components/admin/webhooks-content'

export default async function WebhooksPage() {
  await requirePermission('settings:view')
  return <WebhooksContent />
}
