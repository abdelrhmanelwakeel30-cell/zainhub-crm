import { requirePermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { WebsiteEditShell } from '@/components/website-analysis/websites/website-edit-shell'

export default async function EditWebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('website_analysis:edit')
  const { id } = await params

  const w = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!w) notFound()

  return (
    <WebsiteEditShell
      websiteId={id}
      websiteName={w.name}
      initial={{
        name: w.name,
        domain: w.domain,
        brand: w.brand ?? '',
        type: w.type,
        primaryMarket: w.primaryMarket ?? '',
        primaryLanguage: w.primaryLanguage ?? '',
        notes: w.notes ?? '',
        ownerUserId: w.ownerUserId ?? '',
      }}
    />
  )
}
