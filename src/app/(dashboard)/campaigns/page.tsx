import { requirePermission } from '@/lib/auth-utils'
import { CampaignsContent } from '@/components/campaigns/campaigns-content'

export default async function CampaignsPage() {
  await requirePermission('campaigns:view')
  return <CampaignsContent />
}
