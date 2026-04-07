import { CompanyDetail } from '@/components/companies/company-detail'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CompanyDetail companyId={id} />
}
