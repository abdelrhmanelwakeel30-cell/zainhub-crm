import { requirePermission } from '@/lib/auth-utils'
import { CampaignDetail } from '@/components/campaigns/campaign-detail'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('campaigns:view')
  const { id } = await params
  return <CampaignDetail campaignId={id} />
}
