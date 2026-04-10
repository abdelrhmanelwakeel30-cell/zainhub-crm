import { requirePermission } from '@/lib/auth-utils'
import { LeadDetail } from '@/components/leads/lead-detail'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('leads:view')
  const { id } = await params
  return <LeadDetail leadId={id} />
}
