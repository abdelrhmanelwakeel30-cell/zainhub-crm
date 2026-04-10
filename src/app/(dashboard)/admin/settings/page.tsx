import { requirePermission } from '@/lib/auth-utils'
import { SettingsContent } from '@/components/admin/settings-content'

export default async function SettingsPage() {
  await requirePermission('settings:view')
  return <SettingsContent />
}
