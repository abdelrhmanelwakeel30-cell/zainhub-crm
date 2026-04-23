import { EmptyStateNoData } from '@/components/website-analysis/shared/empty-state-no-data'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <EmptyStateNoData
      title="No conversion data yet"
      description="Connect a data source to see this tab populated with live metrics. Phase 1 ships the foundation; live data comes in the next release."
      primaryAction={{ href: `/website-analysis/websites/${id}/integrations`, label: 'Go to Integrations' }}
    />
  )
}
