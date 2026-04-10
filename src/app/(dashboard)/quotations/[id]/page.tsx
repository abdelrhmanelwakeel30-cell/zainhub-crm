import { requirePermission } from '@/lib/auth-utils'
import { QuotationDetail } from '@/components/quotations/quotation-detail'

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('quotations:view')
  const { id } = await params
  return <QuotationDetail quotationId={id} />
}
