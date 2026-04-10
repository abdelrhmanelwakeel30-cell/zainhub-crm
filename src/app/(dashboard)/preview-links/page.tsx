import { requirePermission } from '@/lib/auth-utils'
import { PreviewLinksContent } from '@/components/preview-links/preview-links-content'

export default async function PreviewLinksPage() {
  await requirePermission('preview_links:view')
  return <PreviewLinksContent />
}
