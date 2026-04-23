import { requirePermission } from '@/lib/auth-utils'
import { WebsiteForm } from '@/components/website-analysis/websites/website-form'

export default async function NewWebsitePage() {
  await requirePermission('website_analysis:create')
  return <WebsiteForm mode="create" />
}
