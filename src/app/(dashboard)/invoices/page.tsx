import { requirePermission } from '@/lib/auth-utils'
import { InvoicesContent } from '@/components/invoices/invoices-content'

export default async function InvoicesPage() {
  await requirePermission('invoices:view')
  return <InvoicesContent />
}
