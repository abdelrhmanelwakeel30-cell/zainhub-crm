import type { IntegrationProvider } from '@/lib/validators/website-analysis'

export interface ProviderMeta {
  id: IntegrationProvider
  label: string
  category: 'analytics' | 'seo' | 'behavior' | 'tagging' | 'ads' | 'pixel'
  phase1Functional: boolean  // true = can be disconnected; false = connect is stubbed
  description: string
}

export const PROVIDER_META: Record<IntegrationProvider, ProviderMeta> = {
  GA4:              { id: 'GA4',              label: 'Google Analytics 4',      category: 'analytics', phase1Functional: false, description: 'Traffic, engagement, and conversion metrics' },
  SEARCH_CONSOLE:   { id: 'SEARCH_CONSOLE',   label: 'Google Search Console',   category: 'seo',       phase1Functional: false, description: 'Organic search impressions, clicks, and rankings' },
  CLARITY:          { id: 'CLARITY',          label: 'Microsoft Clarity',       category: 'behavior',  phase1Functional: false, description: 'Heatmaps, session recordings, and UX insights' },
  GTM:              { id: 'GTM',              label: 'Google Tag Manager',      category: 'tagging',   phase1Functional: false, description: 'Tag and event tracking container' },
  GOOGLE_ADS:       { id: 'GOOGLE_ADS',       label: 'Google Ads',              category: 'ads',       phase1Functional: false, description: 'Paid search campaign performance' },
  META_PIXEL:       { id: 'META_PIXEL',       label: 'Meta Pixel / Ads',        category: 'pixel',     phase1Functional: false, description: 'Facebook/Instagram pixel and ad attribution' },
  LINKEDIN_INSIGHT: { id: 'LINKEDIN_INSIGHT', label: 'LinkedIn Insight Tag',    category: 'pixel',     phase1Functional: false, description: 'LinkedIn audience insights and conversions' },
}

export const PROVIDER_ORDER: IntegrationProvider[] = [
  'GA4',
  'SEARCH_CONSOLE',
  'CLARITY',
  'GTM',
  'GOOGLE_ADS',
  'META_PIXEL',
  'LINKEDIN_INSIGHT',
]
