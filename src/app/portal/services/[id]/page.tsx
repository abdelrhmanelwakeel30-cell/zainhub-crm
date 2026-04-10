import { PortalShell } from '@/components/portal/portal-shell'
import { PortalServiceDetailContent } from '@/components/portal/portal-service-detail-content'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PortalServiceDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <PortalShell>
      <PortalServiceDetailContent id={id} />
    </PortalShell>
  )
}
