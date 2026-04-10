import { requirePermission } from '@/lib/auth-utils'
import { TicketDetail } from '@/components/tickets/ticket-detail'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('tickets:view')
  const { id } = await params
  return <TicketDetail ticketId={id} />
}
