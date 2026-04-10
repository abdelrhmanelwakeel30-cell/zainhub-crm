import { requirePermission } from '@/lib/auth-utils'
import { InvoiceDetail } from '@/components/invoices/invoice-detail'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('invoices:view')
  const { id } = await params
  return <InvoiceDetail invoiceId={id} />
}
