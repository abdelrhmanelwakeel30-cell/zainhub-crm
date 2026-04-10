import { requirePermission } from '@/lib/auth-utils'
import { OpportunityDetail } from '@/components/opportunities/opportunity-detail'

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('opportunities:view')
  const { id } = await params
  return <OpportunityDetail opportunityId={id} />
}
