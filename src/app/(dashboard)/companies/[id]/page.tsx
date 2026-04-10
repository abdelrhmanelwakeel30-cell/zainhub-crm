import { requirePermission } from '@/lib/auth-utils'
import { CompanyDetail } from '@/components/companies/company-detail'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('companies:view')
  const { id } = await params
  return <CompanyDetail companyId={id} />
}
