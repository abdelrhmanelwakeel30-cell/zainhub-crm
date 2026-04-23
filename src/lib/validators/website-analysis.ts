import { z } from 'zod'

export const WEBSITE_TYPES = [
  'CORPORATE',
  'ECOMMERCE',
  'LANDING_PAGE',
  'PORTFOLIO',
  'BLOG',
  'SAAS',
  'CAMPAIGN_PAGE',
  'OTHER',
] as const

export const WEBSITE_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const

export const INTEGRATION_PROVIDERS = [
  'GA4',
  'SEARCH_CONSOLE',
  'CLARITY',
  'GTM',
  'GOOGLE_ADS',
  'META_PIXEL',
  'LINKEDIN_INSIGHT',
] as const

// Normalize domain: strip protocol, trailing slash, whitespace; lowercase
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
}

const domainSchema = z
  .string()
  .min(3)
  .max(253)
  .transform(normalizeDomain)
  .refine((v) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(v), {
    message: 'Invalid domain',
  })

export const createWebsiteSchema = z.object({
  name: z.string().min(2).max(120),
  domain: domainSchema,
  brand: z.string().max(120).optional().or(z.literal('')),
  type: z.enum(WEBSITE_TYPES).default('CORPORATE'),
  primaryMarket: z.string().max(120).optional().or(z.literal('')),
  primaryLanguage: z.string().max(10).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  ownerUserId: z.string().cuid().optional().or(z.literal('')),
})

export const updateWebsiteSchema = createWebsiteSchema.partial().extend({
  status: z.enum(WEBSITE_STATUSES).optional(),
})

export const integrationProviderSchema = z.enum(INTEGRATION_PROVIDERS)

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>
export type IntegrationProvider = z.infer<typeof integrationProviderSchema>
