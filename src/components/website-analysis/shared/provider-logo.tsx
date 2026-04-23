import type { IntegrationProvider } from '@/lib/validators/website-analysis'
import { cn } from '@/lib/utils'

const COLORS: Record<IntegrationProvider, string> = {
  GA4:              'bg-[#F9AB00]/15 text-[#F9AB00]',
  SEARCH_CONSOLE:   'bg-[#4285F4]/15 text-[#4285F4]',
  CLARITY:          'bg-[#8764B8]/15 text-[#8764B8]',
  GTM:              'bg-[#246FDB]/15 text-[#246FDB]',
  GOOGLE_ADS:       'bg-[#34A853]/15 text-[#34A853]',
  META_PIXEL:       'bg-[#1877F2]/15 text-[#1877F2]',
  LINKEDIN_INSIGHT: 'bg-[#0A66C2]/15 text-[#0A66C2]',
}

const INITIALS: Record<IntegrationProvider, string> = {
  GA4: 'GA',
  SEARCH_CONSOLE: 'SC',
  CLARITY: 'CL',
  GTM: 'GTM',
  GOOGLE_ADS: 'Ads',
  META_PIXEL: 'Meta',
  LINKEDIN_INSIGHT: 'Li',
}

export function ProviderLogo({ provider, className }: { provider: IntegrationProvider; className?: string }) {
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-md font-semibold text-xs', COLORS[provider], className)}>
      {INITIALS[provider]}
    </div>
  )
}
