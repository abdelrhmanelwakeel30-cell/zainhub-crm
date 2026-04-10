import { requirePermission } from '@/lib/auth-utils'
import { FormsContent } from '@/components/forms/forms-content'

export default async function FormsPage() {
  await requirePermission('leads:view')
  return <FormsContent />
}
