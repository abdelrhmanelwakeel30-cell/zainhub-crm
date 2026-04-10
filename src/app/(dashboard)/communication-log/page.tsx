import { requirePermission } from '@/lib/auth-utils'
import { CommunicationLogContent } from '@/components/communication-log/communication-log-content'

export default async function CommunicationLogPage() {
  await requirePermission('comms:view')
  return <CommunicationLogContent />
}
