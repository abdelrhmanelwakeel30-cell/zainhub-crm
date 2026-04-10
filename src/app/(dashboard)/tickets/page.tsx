import { requirePermission } from '@/lib/auth-utils'
import { TicketsContent } from '@/components/tickets/tickets-content'

export default async function TicketsPage() {
  await requirePermission('tickets:view')
  return <TicketsContent />
}
