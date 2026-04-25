import { requirePermission } from '@/lib/auth-utils'

export default async function WebsiteAnalysisLayout({ children }: { children: React.ReactNode }) {
  await requirePermission('website_analysis:view')
  return <div className="space-y-6">{children}</div>
}
