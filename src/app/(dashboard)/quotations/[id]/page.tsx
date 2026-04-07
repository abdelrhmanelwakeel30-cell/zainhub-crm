import { QuotationDetail } from '@/components/quotations/quotation-detail'

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <QuotationDetail quotationId={id} />
}
