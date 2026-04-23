import { requirePermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WebsiteAnalysisSubnav } from '@/components/website-analysis/layout/website-analysis-subnav'

export default async function WebsiteDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const session = await requirePermission('website_analysis:view')
  const { id } = await params

  const website = await prisma.website.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true, name: true, domain: true, status: true, type: true },
  })
  if (!website) notFound()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{website.name}</h1>
          <p className="text-sm text-muted-foreground">{website.domain}</p>
        </div>
        <Link href={`/website-analysis/websites/${id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <Pencil className="mr-2 h-4 w-4" />Edit
        </Link>
      </div>
      <WebsiteAnalysisSubnav websiteId={id} />
      <div className="pt-2">{children}</div>
    </div>
  )
}
