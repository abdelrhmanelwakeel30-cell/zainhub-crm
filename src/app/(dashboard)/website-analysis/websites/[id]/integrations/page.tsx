import { requirePermission } from '@/lib/auth-utils'
import { IntegrationList } from '@/components/website-analysis/integrations/integration-list'

export default async function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('website_analysis:view')
  const { id } = await params
  return <IntegrationList websiteId={id} />
}
