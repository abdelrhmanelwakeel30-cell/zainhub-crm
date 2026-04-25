import Link from 'next/link'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'overview',    label: 'Overview' },
  { key: 'traffic',     label: 'Traffic' },
  { key: 'behavior',    label: 'Behavior' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'seo',         label: 'SEO' },
  { key: 'pages',       label: 'Pages' },
  { key: 'devices-geo', label: 'Devices & Geo' },
  { key: 'integrations',label: 'Integrations' },
  { key: 'alerts',      label: 'Alerts' },
  { key: 'reports',     label: 'Reports' },
] as const

interface Props {
  websiteId: string
  activeTab: string
}

export function WebsiteAnalysisSubnav({ websiteId, activeTab }: Props) {
  const base = `/website-analysis/websites/${websiteId}`
  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Website analysis tabs">
      {TABS.map((t) => {
        const href = `${base}?tab=${t.key}`
        const active = activeTab === t.key
        return (
          <Link
            key={t.key}
            href={href}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
