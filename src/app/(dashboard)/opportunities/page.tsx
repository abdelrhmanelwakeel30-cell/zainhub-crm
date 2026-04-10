import { requirePermission } from '@/lib/auth-utils'
import { OpportunitiesContent } from '@/components/opportunities/opportunities-content'

export default async function OpportunitiesPage() {
  await requirePermission('opportunities:view')
  return <OpportunitiesContent />
}
