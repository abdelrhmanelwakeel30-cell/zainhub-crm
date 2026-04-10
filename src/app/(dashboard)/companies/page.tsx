import { requirePermission } from '@/lib/auth-utils'
import { CompaniesContent } from '@/components/companies/companies-content'

export default async function CompaniesPage() {
  await requirePermission('companies:view')
  return <CompaniesContent />
}
