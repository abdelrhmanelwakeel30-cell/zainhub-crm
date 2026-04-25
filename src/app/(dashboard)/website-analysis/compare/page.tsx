import { requirePermission } from '@/lib/auth-utils'
import { EmptyStateNoData } from '@/components/website-analysis/shared/empty-state-no-data'

export default async function ComparePage() {
  await requirePermission('website_analysis:view')
  return (
    <EmptyStateNoData
      title="Comparison needs data"
      description="Multi-website comparison unlocks once two or more websites have at least one connected data source. Coming in a later release."
      primaryAction={{ href: '/website-analysis/websites', label: 'Back to websites' }}
    />
  )
}
