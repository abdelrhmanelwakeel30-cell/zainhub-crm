import { requirePermission } from '@/lib/auth-utils'
import { WebsiteList } from '@/components/website-analysis/websites/website-list'

export default async function WebsitesListPage() {
  await requirePermission('website_analysis:view')
  return <WebsiteList />
}
