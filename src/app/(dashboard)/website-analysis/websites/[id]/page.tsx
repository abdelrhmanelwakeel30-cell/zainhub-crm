import { requirePermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WebsiteAnalysisSubnav } from '@/components/website-analysis/layout/website-analysis-subnav'
import { EmptyStateNoData } from '@/components/website-analysis/shared/empty-state-no-data'
import { IntegrationList } from '@/components/website-analysis/integrations/integration-list'

const TAB_TITLES: Record<string, string> = {
  overview: 'No overview data yet',
  traffic: 'No traffic data yet',
  behavior: 'No behavior data yet',
  conversions: 'No conversion data yet',
  seo: 'No SEO data yet',
  pages: 'No page-level data yet',
  'devices-geo': 'No device or geo data',
  alerts: 'No alerts configured yet',
  reports: 'No reports generated yet',
}

const VALID_TABS = new Set([
  'overview',
  'traffic',
  'behavior',
  'conversions',
  'seo',
  'pages',
  'devices-geo',
  'integrations',
  'alerts',
  'reports',
])

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function WebsiteDetailPage({ params, searchParams }: PageProps) {
  const session = await requirePermission('website_analysis:view')
  const { id } = await params
  const { tab: rawTab } = await searchParams

  const website = await prisma.website.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: { id: true, name: true, domain: true, status: true, type: true },
  })
  if (!website) notFound()

  const tab = rawTab && VALID_TABS.has(rawTab) ? rawTab : 'overview'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{website.name}</h1>
          <p className="text-sm text-muted-foreground">{website.domain}</p>
        </div>
        <Link
          href={`/website-analysis/websites/edit/${id}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <Pencil className="mr-2 h-4 w-4" />Edit
        </Link>
      </div>
      <WebsiteAnalysisSubnav websiteId={id} activeTab={tab} />
      <div className="pt-2">
        {tab === 'integrations' ? (
          <IntegrationList websiteId={id} />
        ) : (
          <EmptyStateNoData
            title={TAB_TITLES[tab] ?? 'No data yet'}
            description="Connect a data source to see this tab populated with live metrics. Phase 1 ships the foundation; live data comes in the next release."
            primaryAction={{
              href: `/website-analysis/websites/${id}?tab=integrations`,
              label: 'Go to Integrations',
            }}
          />
        )}
      </div>
    </div>
  )
}
