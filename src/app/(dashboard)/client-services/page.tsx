import { requirePermission } from '@/lib/auth-utils'
import { ClientServicesContent } from '@/components/client-services/client-services-content'

export default async function ClientServicesPage() {
  await requirePermission('contracts:view')
  return <ClientServicesContent />
}
