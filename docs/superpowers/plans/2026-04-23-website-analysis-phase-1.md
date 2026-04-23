# Website Analysis — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of a new, fully isolated `Website Analysis` section in CRM V3 — data model, CRUD, integrations shell (no OAuth yet), nav, audit, permissions, and empty-state UX for all analytics tabs.

**Architecture:** Append-only Prisma models (`Website`, `WebsiteIntegration`, `WebsiteSyncLog`) with tenant scoping. Next.js App Router routes under `src/app/(dashboard)/website-analysis/`. API routes under `src/app/api/website-analysis/`. React server components for pages, client components for forms/dialogs. Existing `AuditLog` + `Permission`/`Role` tables used — no new auth/audit infra. One sidebar entry; every analytics sub-tab exists but renders an empty state (Integrations tab is functional with disconnect; Connect is a stub).

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7, NextAuth 5 beta, next-intl, React Hook Form + Zod, TanStack Query, shadcn/ui, Tailwind 4, Lucide icons.

**Spec:** [docs/superpowers/specs/2026-04-23-website-analysis-phase-1-design.md](../specs/2026-04-23-website-analysis-phase-1-design.md)

**Isolation invariant (from BRD §5):** Only these existing files may be modified:
`prisma/schema.prisma`, `prisma/seed.ts`, `src/components/layout/sidebar.tsx`, `src/i18n/messages/en.json`, `src/i18n/messages/ar.json`. All other edits happen in new files under the `website-analysis` subtree.

**Permission simplification (refined from spec §4):** The seed uses fixed actions `view|create|edit|delete|export|approve`. Rather than inventing new permission names, we use standard actions:
- `website_analysis:view` → read all
- `website_analysis:create` → add website / connect integration
- `website_analysis:edit` → update website / connect or disconnect integration
- `website_analysis:delete` → delete/archive website
- `website_analysis:export` → reports (reserved for Phase 5)

**Verification approach:** This project has no test framework configured. We verify with (a) `npm run build` (typecheck + build), (b) `npm run lint`, and (c) explicit manual smoke checks per task. **Do not** add vitest/jest/playwright — out of scope and violates the isolation rule.

---

## File Structure

**Created:**
```
prisma/migrations/<timestamp>_add_website_analysis/migration.sql   # auto-generated
src/lib/validators/website-analysis.ts
src/lib/website-analysis/providers.ts                              # provider metadata (labels, logos, OAuth-stub flag)
src/app/(dashboard)/website-analysis/layout.tsx
src/app/(dashboard)/website-analysis/page.tsx
src/app/(dashboard)/website-analysis/websites/page.tsx
src/app/(dashboard)/website-analysis/websites/new/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/layout.tsx
src/app/(dashboard)/website-analysis/websites/[id]/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/overview/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/traffic/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/behavior/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/conversions/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/seo/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/pages/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/devices-geo/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/integrations/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/alerts/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/reports/page.tsx
src/app/(dashboard)/website-analysis/websites/[id]/edit/page.tsx
src/app/(dashboard)/website-analysis/compare/page.tsx
src/app/api/website-analysis/websites/route.ts
src/app/api/website-analysis/websites/[id]/route.ts
src/app/api/website-analysis/websites/[id]/integrations/route.ts
src/app/api/website-analysis/websites/[id]/integrations/[provider]/connect/route.ts
src/app/api/website-analysis/websites/[id]/integrations/[provider]/disconnect/route.ts
src/app/api/website-analysis/websites/[id]/sync-logs/route.ts
src/components/website-analysis/shared/empty-state-no-data.tsx
src/components/website-analysis/shared/empty-state-no-website.tsx
src/components/website-analysis/shared/sync-status-badge.tsx
src/components/website-analysis/shared/provider-logo.tsx
src/components/website-analysis/websites/website-list.tsx
src/components/website-analysis/websites/website-form.tsx
src/components/website-analysis/websites/website-delete-dialog.tsx
src/components/website-analysis/integrations/integration-card.tsx
src/components/website-analysis/integrations/integration-list.tsx
src/components/website-analysis/integrations/disconnect-dialog.tsx
src/components/website-analysis/integrations/connect-stub-dialog.tsx
src/components/website-analysis/layout/website-analysis-subnav.tsx
```

**Modified:**
- `prisma/schema.prisma` — append 3 models + 3 enums + back-relations on `Tenant` and `User`
- `prisma/seed.ts` — add `'website_analysis'` to `modules` array
- `src/components/layout/sidebar.tsx` — add one nav group with one entry
- `src/i18n/messages/en.json` — add `nav.websiteAnalysis`, `nav.sections.websiteAnalysis`, `websiteAnalysis.*`
- `src/i18n/messages/ar.json` — Arabic translations of the same keys

---

## Task 1: Add Prisma enums and `Website` model

**Files:**
- Modify: `prisma/schema.prisma` — append to end of file

- [ ] **Step 1: Append enums and `Website` model**

Append this block to the end of `prisma/schema.prisma`:

```prisma
// ============================================================================
// WEBSITE ANALYSIS MODULE (Phase 1 — foundation)
// Isolated new section. All models tenant-scoped.
// ============================================================================

enum WebsiteType {
  CORPORATE
  ECOMMERCE
  LANDING_PAGE
  PORTFOLIO
  BLOG
  SAAS
  CAMPAIGN_PAGE
  OTHER
}

enum WebsiteStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum WebsiteIntegrationProvider {
  GA4
  SEARCH_CONSOLE
  CLARITY
  GTM
  GOOGLE_ADS
  META_PIXEL
  LINKEDIN_INSIGHT
}

enum IntegrationStatus {
  NOT_CONNECTED
  CONNECTED
  ERROR
  EXPIRED
  SYNCING
}

enum SyncStatus {
  SUCCESS
  PARTIAL
  FAILED
}

model Website {
  id              String        @id @default(cuid())
  tenantId        String
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  domain          String
  brand           String?
  type            WebsiteType   @default(CORPORATE)
  primaryMarket   String?
  primaryLanguage String?
  notes           String?
  status          WebsiteStatus @default(ACTIVE)

  ownerUserId     String?
  ownerUser       User?         @relation("WebsiteOwner", fields: [ownerUserId], references: [id])

  createdById     String
  createdBy       User          @relation("WebsiteCreatedBy", fields: [createdById], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  integrations    WebsiteIntegration[]
  syncLogs        WebsiteSyncLog[]

  @@unique([tenantId, domain])
  @@index([tenantId, status])
  @@index([tenantId, type])
}
```

- [ ] **Step 2: Verify Prisma syntax (no generation yet)**

Run: `npx prisma format`
Expected: formats the file in place, exits 0. If errors appear, fix them.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(website-analysis): add Website model and enums"
```

---

## Task 2: Add `WebsiteIntegration` model

**Files:**
- Modify: `prisma/schema.prisma` — append after Task 1's block

- [ ] **Step 1: Append `WebsiteIntegration` model**

Append to `prisma/schema.prisma`:

```prisma
model WebsiteIntegration {
  id                   String                     @id @default(cuid())
  tenantId             String
  tenant               Tenant                     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  websiteId            String
  website              Website                    @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  provider             WebsiteIntegrationProvider
  status               IntegrationStatus          @default(NOT_CONNECTED)

  externalAccountId    String?
  externalAccountLabel String?

  // Phase 1 never fills these — Phase 2 (OAuth) will
  accessTokenEnc       String?
  refreshTokenEnc      String?
  tokenExpiresAt       DateTime?
  scopes               String[]

  lastSyncAt           DateTime?
  lastSyncStatus       SyncStatus?
  lastErrorMsg         String?

  connectedById        String?
  connectedBy          User?                      @relation("WebsiteIntegrationConnectedBy", fields: [connectedById], references: [id])
  connectedAt          DateTime?
  disconnectedAt       DateTime?

  createdAt            DateTime                   @default(now())
  updatedAt            DateTime                   @updatedAt

  syncLogs             WebsiteSyncLog[]

  @@unique([websiteId, provider])
  @@index([tenantId, status])
  @@index([tenantId, provider])
}
```

- [ ] **Step 2: Format**

Run: `npx prisma format`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(website-analysis): add WebsiteIntegration model"
```

---

## Task 3: Add `WebsiteSyncLog` + back-relations on `Tenant` and `User`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Append `WebsiteSyncLog` model to end**

```prisma
model WebsiteSyncLog {
  id             String             @id @default(cuid())
  tenantId       String
  tenant         Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  websiteId      String
  website        Website            @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  integrationId  String
  integration    WebsiteIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  status         SyncStatus
  startedAt      DateTime           @default(now())
  finishedAt     DateTime?
  rowsProcessed  Int?
  errorSummary   String?
  errorDetail    Json?
  retryOf        String?

  @@index([tenantId, websiteId, startedAt])
  @@index([integrationId, startedAt])
}
```

- [ ] **Step 2: Add back-relations on `Tenant` — append to its relations list**

In `prisma/schema.prisma`, find the `Tenant` model (starts around line 338). At the end of the relations list (after `accountHealthRecords AccountHealth[]`, just before the closing `}`), append:

```prisma
  // Website Analysis module
  websites             Website[]
  websiteIntegrations  WebsiteIntegration[]
  websiteSyncLogs      WebsiteSyncLog[]
```

- [ ] **Step 3: Add back-relations on `User` — append to its relations list**

In the `User` model (starts around line 422), append to its relations list (just before `@@unique([tenantId, email])`):

```prisma
  // Website Analysis module
  ownedWebsites                     Website[]            @relation("WebsiteOwner")
  createdWebsites                   Website[]            @relation("WebsiteCreatedBy")
  connectedWebsiteIntegrations      WebsiteIntegration[] @relation("WebsiteIntegrationConnectedBy")
```

- [ ] **Step 4: Format**

Run: `npx prisma format`
Expected: exit 0. If Prisma complains about dangling relations, re-check all three `@relation(...)` names match.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(website-analysis): add WebsiteSyncLog and back-relations"
```

---

## Task 4: Generate migration and Prisma client

**Files:**
- Create: `prisma/migrations/<auto>_add_website_analysis/migration.sql`

- [ ] **Step 1: Create the migration**

Run: `npx prisma migrate dev --name add_website_analysis`
Expected: new migration folder created, SQL applied to dev DB, Prisma client regenerated. If a conflict appears, stop and investigate — do **not** reset the DB.

- [ ] **Step 2: Verify new models are in the generated client**

Run: `node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); console.log(typeof p.website, typeof p.websiteIntegration, typeof p.websiteSyncLog)"`
Expected: `object object object`

- [ ] **Step 3: Commit**

```bash
git add prisma/migrations/
git commit -m "chore(website-analysis): add migration for Phase 1 models"
```

---

## Task 5: Add `website_analysis` to permission seed

**Files:**
- Modify: `prisma/seed.ts` — extend the `modules` array (around line 96–104)

- [ ] **Step 1: Add the new module**

Change the `modules` declaration in `prisma/seed.ts` from:

```ts
const modules = [
    'dashboard', 'leads', 'companies', 'contacts', 'opportunities',
    'projects', 'tasks', 'quotations', 'proposals', 'contracts',
    'invoices', 'payments', 'expenses', 'tickets', 'social_media',
    'campaigns', 'documents', 'reports', 'users', 'roles', 'settings', 'audit_log',
    // New modules (Priority 1-4)
    'change_requests', 'approvals', 'deliverables', 'preview_links', 'comms',
    'client_services', 'subscriptions', 'bundles', 'forms', 'account_health', 'onboarding',
  ]
```

to (append `'website_analysis'` as the final entry):

```ts
const modules = [
    'dashboard', 'leads', 'companies', 'contacts', 'opportunities',
    'projects', 'tasks', 'quotations', 'proposals', 'contracts',
    'invoices', 'payments', 'expenses', 'tickets', 'social_media',
    'campaigns', 'documents', 'reports', 'users', 'roles', 'settings', 'audit_log',
    // New modules (Priority 1-4)
    'change_requests', 'approvals', 'deliverables', 'preview_links', 'comms',
    'client_services', 'subscriptions', 'bundles', 'forms', 'account_health', 'onboarding',
    // Website Analysis (Phase 1)
    'website_analysis',
  ]
```

Super Admin automatically receives all 6 actions (loop at line 170–175). Manager receives `view/create/edit/export` (line 177–182). Viewer receives `view` (line 192–197). No further seed changes needed.

- [ ] **Step 2: Re-run seed**

Run: `npx prisma db seed`
Expected: seed completes without error. The existing data is deleted and reseeded — this is normal dev flow.

- [ ] **Step 3: Verify permission rows exist**

Run: `npx prisma studio` in another terminal, open the `Permission` table, filter by `module = website_analysis`. You should see 6 rows (one per action). (Alternatively: `node -e "const {PrismaClient}=require('@prisma/client'); new PrismaClient().permission.findMany({where:{module:'website_analysis'}}).then(r=>{console.log(r.length); process.exit(0)})"` → expect `6`.)

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(website-analysis): seed permissions for website_analysis module"
```

---

## Task 6: Zod validators

**Files:**
- Create: `src/lib/validators/website-analysis.ts`

- [ ] **Step 1: Write the validators**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validators/website-analysis.ts
git commit -m "feat(website-analysis): add zod validators and domain normalizer"
```

---

## Task 7: Provider metadata helper

**Files:**
- Create: `src/lib/website-analysis/providers.ts`

- [ ] **Step 1: Write the metadata**

```ts
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
```

- [ ] **Step 2: Typecheck + commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/lib/website-analysis/providers.ts
git commit -m "feat(website-analysis): add provider metadata and ordering"
```

---

## Task 8: Websites list API — `GET /api/website-analysis/websites` + `POST`

**Files:**
- Create: `src/app/api/website-analysis/websites/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { createWebsiteSchema } from '@/lib/validators/website-analysis'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search') || ''

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' as const } },
    { domain: { contains: search, mode: 'insensitive' as const } },
    { brand: { contains: search, mode: 'insensitive' as const } },
  ]

  try {
    const websites = await prisma.website.findMany({
      where,
      include: {
        ownerUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        integrations: { select: { id: true, provider: true, status: true, lastSyncAt: true } },
        _count: { select: { integrations: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: websites })
  } catch (err) {
    console.error('GET /api/website-analysis/websites', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('website_analysis:create')
  if (!guard.ok) return guard.response
  const { session } = guard

  try {
    const body = await req.json()
    const parsed = createWebsiteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const data = parsed.data

    const existing = await prisma.website.findUnique({
      where: { tenantId_domain: { tenantId: session.user.tenantId, domain: data.domain } },
    })
    if (existing) return NextResponse.json({ success: false, error: 'Domain already registered for this tenant' }, { status: 409 })

    const website = await prisma.website.create({
      data: {
        tenantId: session.user.tenantId,
        name: data.name,
        domain: data.domain,
        brand: data.brand || null,
        type: data.type,
        primaryMarket: data.primaryMarket || null,
        primaryLanguage: data.primaryLanguage || null,
        notes: data.notes || null,
        ownerUserId: data.ownerUserId || null,
        createdById: session.user.id,
      },
    })

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Website',
      entityId: website.id,
      entityName: website.name,
      afterValue: website as unknown as Record<string, unknown>,
      sourceModule: 'website-analysis',
      req,
    })

    return NextResponse.json({ success: true, data: website }, { status: 201 })
  } catch (err) {
    console.error('POST /api/website-analysis/websites', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/website-analysis/websites/route.ts
git commit -m "feat(website-analysis): add websites list + create API"
```

---

## Task 9: Website detail API — `GET`, `PATCH`, `DELETE /api/website-analysis/websites/[id]`

**Files:**
- Create: `src/app/api/website-analysis/websites/[id]/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { updateWebsiteSchema } from '@/lib/validators/website-analysis'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const website = await prisma.website.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      ownerUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      integrations: true,
    },
  })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: website })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:edit')
  if (!guard.ok) return guard.response
  const { session } = guard
  const { id } = await ctx.params

  try {
    const existing = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateWebsiteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const data = parsed.data
    const updated = await prisma.website.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.domain !== undefined && { domain: data.domain }),
        ...(data.brand !== undefined && { brand: data.brand || null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.primaryMarket !== undefined && { primaryMarket: data.primaryMarket || null }),
        ...(data.primaryLanguage !== undefined && { primaryLanguage: data.primaryLanguage || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.ownerUserId !== undefined && { ownerUserId: data.ownerUserId || null }),
        ...(data.status !== undefined && { status: data.status }),
      },
    })

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Website',
      entityId: updated.id,
      entityName: updated.name,
      beforeValue: existing as unknown as Record<string, unknown>,
      afterValue: updated as unknown as Record<string, unknown>,
      sourceModule: 'website-analysis',
      req,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('PATCH /api/website-analysis/websites/[id]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:delete')
  if (!guard.ok) return guard.response
  const { session } = guard
  const { id } = await ctx.params

  const existing = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  // Soft-delete (spec §15 Q1) — default is archive, not destroy
  const updated = await prisma.website.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: 'ARCHIVE',
    entityType: 'Website',
    entityId: updated.id,
    entityName: updated.name,
    beforeValue: existing as unknown as Record<string, unknown>,
    afterValue: updated as unknown as Record<string, unknown>,
    sourceModule: 'website-analysis',
    req,
  })

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/api/website-analysis/websites/\[id\]/route.ts
git commit -m "feat(website-analysis): add website detail GET/PATCH/DELETE API"
```

---

## Task 10: Integrations list + connect stub + disconnect APIs

**Files:**
- Create: `src/app/api/website-analysis/websites/[id]/integrations/route.ts`
- Create: `src/app/api/website-analysis/websites/[id]/integrations/[provider]/connect/route.ts`
- Create: `src/app/api/website-analysis/websites/[id]/integrations/[provider]/disconnect/route.ts`
- Create: `src/app/api/website-analysis/websites/[id]/sync-logs/route.ts`

- [ ] **Step 1: Integrations GET (list all providers, merge with DB state)**

`src/app/api/website-analysis/websites/[id]/integrations/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { PROVIDER_ORDER, PROVIDER_META } from '@/lib/website-analysis/providers'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const existing = await prisma.websiteIntegration.findMany({ where: { websiteId: id } })
  const byProvider = new Map(existing.map((i) => [i.provider, i]))

  // Return one row per provider — DB row if present, otherwise synthetic NOT_CONNECTED
  const data = PROVIDER_ORDER.map((provider) => {
    const row = byProvider.get(provider)
    return {
      provider,
      meta: PROVIDER_META[provider],
      integration: row ?? {
        id: null,
        status: 'NOT_CONNECTED' as const,
        lastSyncAt: null,
        lastSyncStatus: null,
        lastErrorMsg: null,
        connectedAt: null,
        externalAccountLabel: null,
      },
    }
  })

  return NextResponse.json({ success: true, data })
}
```

- [ ] **Step 2: Connect stub**

`src/app/api/website-analysis/websites/[id]/integrations/[provider]/connect/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { integrationProviderSchema } from '@/lib/validators/website-analysis'

interface Ctx { params: Promise<{ id: string; provider: string }> }

// Phase 1 stub — returns NOT_IMPLEMENTED_PHASE_1 and audit-logs the attempt.
// Phase 2 replaces this body with the real OAuth authorization URL builder.
export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:edit')
  if (!guard.ok) return guard.response
  const { session } = guard

  const { id, provider: providerRaw } = await ctx.params
  const parsedProvider = integrationProviderSchema.safeParse(providerRaw)
  if (!parsedProvider.success) return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 })
  const provider = parsedProvider.data

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true, name: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'WebsiteIntegration',
    entityId: `${id}:${provider}`,
    entityName: `${website.name} / ${provider}`,
    afterValue: { attempted: true, provider, reason: 'NOT_IMPLEMENTED_PHASE_1' },
    sourceModule: 'website-analysis',
    req,
  })

  return NextResponse.json(
    { success: false, reason: 'NOT_IMPLEMENTED_PHASE_1', message: 'Connecting this provider goes live in the next release.' },
    { status: 501 },
  )
}
```

- [ ] **Step 3: Disconnect (fully functional)**

`src/app/api/website-analysis/websites/[id]/integrations/[provider]/disconnect/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { integrationProviderSchema } from '@/lib/validators/website-analysis'

interface Ctx { params: Promise<{ id: string; provider: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:edit')
  if (!guard.ok) return guard.response
  const { session } = guard

  const { id, provider: providerRaw } = await ctx.params
  const parsedProvider = integrationProviderSchema.safeParse(providerRaw)
  if (!parsedProvider.success) return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 })
  const provider = parsedProvider.data

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true, name: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const existing = await prisma.websiteIntegration.findUnique({ where: { websiteId_provider: { websiteId: id, provider } } })
  if (!existing) return NextResponse.json({ success: true, data: { alreadyDisconnected: true } })

  const updated = await prisma.websiteIntegration.update({
    where: { id: existing.id },
    data: {
      status: 'NOT_CONNECTED',
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      scopes: [],
      disconnectedAt: new Date(),
      lastErrorMsg: null,
    },
  })

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'WebsiteIntegration',
    entityId: updated.id,
    entityName: `${website.name} / ${provider}`,
    beforeValue: existing as unknown as Record<string, unknown>,
    afterValue: updated as unknown as Record<string, unknown>,
    sourceModule: 'website-analysis',
    req,
  })

  return NextResponse.json({ success: true, data: updated })
}
```

- [ ] **Step 4: Sync logs list (Phase 1: always empty, but route must exist)**

`src/app/api/website-analysis/websites/[id]/sync-logs/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await ctx.params

  const website = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId }, select: { id: true } })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const logs = await prisma.websiteSyncLog.findMany({
    where: { websiteId: id },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ success: true, data: logs })
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/api/website-analysis
git commit -m "feat(website-analysis): add integrations list, connect stub, disconnect, sync-logs APIs"
```

---

## Task 11: Shared empty-state components + sync badge + provider logo

**Files:**
- Create: `src/components/website-analysis/shared/empty-state-no-data.tsx`
- Create: `src/components/website-analysis/shared/empty-state-no-website.tsx`
- Create: `src/components/website-analysis/shared/sync-status-badge.tsx`
- Create: `src/components/website-analysis/shared/provider-logo.tsx`

- [ ] **Step 1: `empty-state-no-data.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

interface Props {
  title?: string
  description?: string
  primaryAction?: { href: string; label: string }
}

export function EmptyStateNoData({
  title = 'No data yet',
  description = 'Connect a data source to start seeing analytics for this website.',
  primaryAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
      <BarChart3 className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">{description}</p>
      {primaryAction && (
        <Button asChild>
          <Link href={primaryAction.href}>{primaryAction.label}</Link>
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: `empty-state-no-website.tsx`**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function EmptyStateNoWebsite() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-12 text-center">
      <Globe className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h3 className="mb-1 text-lg font-semibold">Add your first website</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">
        Register a website to start tracking its analytics, conversions, and SEO performance.
      </p>
      <Button asChild>
        <Link href="/website-analysis/websites/new">Add website</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: `sync-status-badge.tsx`**

```tsx
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

type Status = 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR' | 'EXPIRED' | 'SYNCING'

const STYLES: Record<Status, string> = {
  NOT_CONNECTED: 'bg-muted text-muted-foreground',
  CONNECTED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ERROR: 'bg-red-500/15 text-red-700 dark:text-red-400',
  EXPIRED: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SYNCING: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
}

const LABELS: Record<Status, string> = {
  NOT_CONNECTED: 'Not connected',
  CONNECTED: 'Connected',
  ERROR: 'Error',
  EXPIRED: 'Expired',
  SYNCING: 'Syncing…',
}

export function SyncStatusBadge({ status, lastSyncAt }: { status: Status; lastSyncAt?: string | Date | null }) {
  return (
    <div className="flex items-center gap-2">
      <Badge className={STYLES[status]}>{LABELS[status]}</Badge>
      {lastSyncAt && (
        <span className="text-xs text-muted-foreground">
          Last sync {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 4: `provider-logo.tsx` (initials-based fallback — no external assets needed)**

```tsx
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
```

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit
git add src/components/website-analysis/shared
git commit -m "feat(website-analysis): add shared empty-state, sync badge, provider logo components"
```

---

## Task 12: Sub-nav tabs component + module layout

**Files:**
- Create: `src/components/website-analysis/layout/website-analysis-subnav.tsx`
- Create: `src/app/(dashboard)/website-analysis/layout.tsx`
- Create: `src/app/(dashboard)/website-analysis/page.tsx`

- [ ] **Step 1: Top-level layout (just a header wrapper)**

`src/app/(dashboard)/website-analysis/layout.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'

export default async function WebsiteAnalysisLayout({ children }: { children: React.ReactNode }) {
  await requirePermission('website_analysis:view')
  return <div className="space-y-6">{children}</div>
}
```

- [ ] **Step 2: Index page redirects to websites list**

`src/app/(dashboard)/website-analysis/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function WebsiteAnalysisIndex() {
  redirect('/website-analysis/websites')
}
```

- [ ] **Step 3: Sub-nav for a single website's detail tabs**

`src/components/website-analysis/layout/website-analysis-subnav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export function WebsiteAnalysisSubnav({ websiteId }: { websiteId: string }) {
  const pathname = usePathname()
  const base = `/website-analysis/websites/${websiteId}`

  return (
    <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Website analysis tabs">
      {TABS.map((t) => {
        const href = `${base}/${t.key}`
        const active = pathname === href || pathname.startsWith(`${href}/`)
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
```

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add src/app/\(dashboard\)/website-analysis src/components/website-analysis/layout
git commit -m "feat(website-analysis): add module layout, index redirect, subnav"
```

---

## Task 13: Websites list page + client list component

**Files:**
- Create: `src/components/website-analysis/websites/website-list.tsx`
- Create: `src/app/(dashboard)/website-analysis/websites/page.tsx`

- [ ] **Step 1: Client list component**

`src/components/website-analysis/websites/website-list.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ExternalLink } from 'lucide-react'
import { EmptyStateNoWebsite } from '@/components/website-analysis/shared/empty-state-no-website'
import { formatDistanceToNow } from 'date-fns'

interface IntegrationSummary {
  id: string
  provider: string
  status: string
  lastSyncAt: string | null
}

interface Website {
  id: string
  name: string
  domain: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  type: string
  createdAt: string
  integrations: IntegrationSummary[]
  _count: { integrations: number }
}

export function WebsiteList() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: Website[] }>({
    queryKey: ['websites'],
    queryFn: () => fetch('/api/website-analysis/websites').then((r) => r.json()),
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>
  if (isError || !data?.success) return <div className="p-8 text-sm text-red-600">Failed to load websites.</div>

  const websites = data.data
  const active = websites.filter((w) => w.status !== 'ARCHIVED')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Websites</h1>
          <p className="text-sm text-muted-foreground">Register and analyze your web properties in one place.</p>
        </div>
        <Button asChild>
          <Link href="/website-analysis/websites/new"><Plus className="mr-2 h-4 w-4" />Add website</Link>
        </Button>
      </div>

      {active.length === 0 ? (
        <EmptyStateNoWebsite />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((w) => {
            const connected = w.integrations.filter((i) => i.status === 'CONNECTED').length
            return (
              <Link
                key={w.id}
                href={`/website-analysis/websites/${w.id}/overview`}
                className="rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{w.name}</h3>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      {w.domain}
                    </p>
                  </div>
                  <Badge variant="outline">{w.type.replace('_', ' ')}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{connected} of {w.integrations.length || 7} sources connected</span>
                  <span>Added {formatDistanceToNow(new Date(w.createdAt), { addSuffix: true })}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Websites list page**

`src/app/(dashboard)/website-analysis/websites/page.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'
import { WebsiteList } from '@/components/website-analysis/websites/website-list'

export default async function WebsitesListPage() {
  await requirePermission('website_analysis:view')
  return <WebsiteList />
}
```

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add src/app/\(dashboard\)/website-analysis/websites/page.tsx src/components/website-analysis/websites/website-list.tsx
git commit -m "feat(website-analysis): add websites list page"
```

---

## Task 14: Add-website form + new-website page

**Files:**
- Create: `src/components/website-analysis/websites/website-form.tsx`
- Create: `src/app/(dashboard)/website-analysis/websites/new/page.tsx`

- [ ] **Step 1: Form component (reusable for add + edit)**

`src/components/website-analysis/websites/website-form.tsx`:

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createWebsiteSchema, WEBSITE_TYPES, type CreateWebsiteInput } from '@/lib/validators/website-analysis'

interface Props {
  mode: 'create' | 'edit'
  websiteId?: string
  initial?: Partial<CreateWebsiteInput>
}

export function WebsiteForm({ mode, websiteId, initial }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const form = useForm<CreateWebsiteInput>({
    resolver: zodResolver(createWebsiteSchema),
    defaultValues: {
      name: initial?.name ?? '',
      domain: initial?.domain ?? '',
      brand: initial?.brand ?? '',
      type: (initial?.type as CreateWebsiteInput['type']) ?? 'CORPORATE',
      primaryMarket: initial?.primaryMarket ?? '',
      primaryLanguage: initial?.primaryLanguage ?? '',
      notes: initial?.notes ?? '',
      ownerUserId: initial?.ownerUserId ?? '',
    },
  })

  const submit = useMutation({
    mutationFn: async (values: CreateWebsiteInput) => {
      const url = mode === 'create'
        ? '/api/website-analysis/websites'
        : `/api/website-analysis/websites/${websiteId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) })
      const json = await r.json()
      if (!r.ok || !json.success) throw new Error(typeof json.error === 'string' ? json.error : 'Save failed')
      return json.data as { id: string }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['websites'] })
      if (mode === 'create') {
        toast.success('Website added')
        router.push(`/website-analysis/websites/${data.id}/integrations`)
      } else {
        toast.success('Website updated')
        router.push(`/website-analysis/websites/${websiteId}/overview`)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">{mode === 'create' ? 'Add website' : 'Edit website'}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...form.register('name')} />
          {form.formState.errors.name && <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="domain">Domain *</Label>
          <Input id="domain" {...form.register('domain')} placeholder="example.com" />
          {form.formState.errors.domain && <p className="mt-1 text-xs text-red-600">{form.formState.errors.domain.message}</p>}
        </div>
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" {...form.register('brand')} />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v as CreateWebsiteInput['type'])}>
            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEBSITE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="primaryMarket">Primary market</Label>
          <Input id="primaryMarket" {...form.register('primaryMarket')} placeholder="AE, SA, Global…" />
        </div>
        <div>
          <Label htmlFor="primaryLanguage">Primary language</Label>
          <Input id="primaryLanguage" {...form.register('primaryLanguage')} placeholder="en, ar…" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register('notes')} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Saving…' : mode === 'create' ? 'Add website' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: New-website page**

`src/app/(dashboard)/website-analysis/websites/new/page.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'
import { WebsiteForm } from '@/components/website-analysis/websites/website-form'

export default async function NewWebsitePage() {
  await requirePermission('website_analysis:create')
  return <WebsiteForm mode="create" />
}
```

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add src/components/website-analysis/websites/website-form.tsx src/app/\(dashboard\)/website-analysis/websites/new
git commit -m "feat(website-analysis): add create website form + new-website page"
```

---

## Task 15: Website detail layout + all 10 tab pages (empty states) + index redirect

**Files:**
- Create: `src/app/(dashboard)/website-analysis/websites/[id]/layout.tsx`
- Create: `src/app/(dashboard)/website-analysis/websites/[id]/page.tsx`
- Create 8 empty-state pages: `overview/`, `traffic/`, `behavior/`, `conversions/`, `seo/`, `pages/`, `devices-geo/`, `alerts/`, `reports/`  (9 total incl. `compare` later)

- [ ] **Step 1: Detail layout — fetches website header info + renders subnav**

`src/app/(dashboard)/website-analysis/websites/[id]/layout.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
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
        <Button asChild variant="outline" size="sm">
          <Link href={`/website-analysis/websites/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />Edit
          </Link>
        </Button>
      </div>
      <WebsiteAnalysisSubnav websiteId={id} />
      <div className="pt-2">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Index page redirects to overview**

`src/app/(dashboard)/website-analysis/websites/[id]/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default async function WebsiteDetailIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/website-analysis/websites/${id}/overview`)
}
```

- [ ] **Step 3: 8 empty-state tab pages (one file each)**

For each of `overview`, `traffic`, `behavior`, `conversions`, `seo`, `pages`, `devices-geo`, `alerts`, `reports`, create the file at
`src/app/(dashboard)/website-analysis/websites/[id]/<tab>/page.tsx` with this content (replace `<TITLE>` per tab — listed below):

```tsx
import { EmptyStateNoData } from '@/components/website-analysis/shared/empty-state-no-data'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <EmptyStateNoData
      title="<TITLE>"
      description="Connect a data source to see this tab populated with live metrics. Phase 1 ships the foundation; live data comes in the next release."
      primaryAction={{ href: `/website-analysis/websites/${id}/integrations`, label: 'Go to Integrations' }}
    />
  )
}
```

Titles per tab:
| Tab          | `<TITLE>`                  |
| ------------ | -------------------------- |
| overview     | `No overview data yet`     |
| traffic      | `No traffic data yet`      |
| behavior     | `No behavior data yet`     |
| conversions  | `No conversion data yet`   |
| seo          | `No SEO data yet`          |
| pages        | `No page-level data yet`   |
| devices-geo  | `No device or geo data`    |
| alerts       | `No alerts configured yet` |
| reports      | `No reports generated yet` |

- [ ] **Step 4: Commit**

```bash
npx tsc --noEmit
git add src/app/\(dashboard\)/website-analysis/websites/\[id\]
git commit -m "feat(website-analysis): add website detail layout + 9 empty-state tab pages"
```

---

## Task 16: Integrations tab — functional integration-list + card + dialogs

**Files:**
- Create: `src/components/website-analysis/integrations/integration-card.tsx`
- Create: `src/components/website-analysis/integrations/integration-list.tsx`
- Create: `src/components/website-analysis/integrations/disconnect-dialog.tsx`
- Create: `src/components/website-analysis/integrations/connect-stub-dialog.tsx`
- Create: `src/app/(dashboard)/website-analysis/websites/[id]/integrations/page.tsx`

- [ ] **Step 1: `connect-stub-dialog.tsx`**

```tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  providerLabel: string
}

export function ConnectStubDialog({ open, onOpenChange, providerLabel }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connecting {providerLabel} is coming next</DialogTitle>
          <DialogDescription>
            Phase 1 of the Website Analysis module ships the foundation: data model, website management,
            and the Integrations shell. Live OAuth and data sync for {providerLabel} lands in the next release.
            Your attempt has been recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: `disconnect-dialog.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  websiteId: string
  provider: string
  providerLabel: string
}

export function DisconnectDialog({ open, onOpenChange, websiteId, provider, providerLabel }: Props) {
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)
  const m = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/website-analysis/websites/${websiteId}/integrations/${provider}/disconnect`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok || !j.success) throw new Error(j.error || 'Disconnect failed')
    },
    onMutate: () => setPending(true),
    onSettled: () => setPending(false),
    onSuccess: () => {
      toast.success(`${providerLabel} disconnected`)
      qc.invalidateQueries({ queryKey: ['integrations', websiteId] })
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {providerLabel}?</DialogTitle>
          <DialogDescription>
            Stored credentials and sync state will be cleared. You can reconnect at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="destructive" onClick={() => m.mutate()} disabled={pending}>
            {pending ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: `integration-card.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ProviderLogo } from '@/components/website-analysis/shared/provider-logo'
import { SyncStatusBadge } from '@/components/website-analysis/shared/sync-status-badge'
import { ConnectStubDialog } from './connect-stub-dialog'
import { DisconnectDialog } from './disconnect-dialog'
import type { IntegrationProvider } from '@/lib/validators/website-analysis'
import type { ProviderMeta } from '@/lib/website-analysis/providers'

interface IntegrationRow {
  provider: IntegrationProvider
  meta: ProviderMeta
  integration: {
    id: string | null
    status: 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR' | 'EXPIRED' | 'SYNCING'
    lastSyncAt: string | null
    externalAccountLabel: string | null
  }
}

export function IntegrationCard({ row, websiteId }: { row: IntegrationRow; websiteId: string }) {
  const [showStub, setShowStub] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const connectAttempt = useMutation({
    mutationFn: async () => {
      // Fire audit-logged stub call, then show explanatory dialog
      await fetch(`/api/website-analysis/websites/${websiteId}/integrations/${row.provider}/connect`, { method: 'POST' })
    },
    onSuccess: () => setShowStub(true),
    onError: () => setShowStub(true),
  })

  const connected = row.integration.status === 'CONNECTED'

  return (
    <div className="flex flex-col rounded-lg border bg-card p-5">
      <div className="flex items-start gap-3">
        <ProviderLogo provider={row.provider} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{row.meta.label}</h3>
          <p className="text-xs text-muted-foreground">{row.meta.description}</p>
        </div>
      </div>

      <div className="my-4">
        <SyncStatusBadge status={row.integration.status} lastSyncAt={row.integration.lastSyncAt} />
      </div>

      <div className="mt-auto flex gap-2">
        {connected ? (
          <Button variant="outline" size="sm" onClick={() => setShowDisconnect(true)}>Disconnect</Button>
        ) : (
          <Button size="sm" onClick={() => connectAttempt.mutate()} disabled={connectAttempt.isPending}>
            Connect
          </Button>
        )}
      </div>

      <ConnectStubDialog open={showStub} onOpenChange={setShowStub} providerLabel={row.meta.label} />
      <DisconnectDialog
        open={showDisconnect}
        onOpenChange={setShowDisconnect}
        websiteId={websiteId}
        provider={row.provider}
        providerLabel={row.meta.label}
      />
    </div>
  )
}
```

- [ ] **Step 4: `integration-list.tsx`**

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { IntegrationCard } from './integration-card'
import type { IntegrationProvider } from '@/lib/validators/website-analysis'
import type { ProviderMeta } from '@/lib/website-analysis/providers'

interface IntegrationRow {
  provider: IntegrationProvider
  meta: ProviderMeta
  integration: {
    id: string | null
    status: 'NOT_CONNECTED' | 'CONNECTED' | 'ERROR' | 'EXPIRED' | 'SYNCING'
    lastSyncAt: string | null
    externalAccountLabel: string | null
  }
}

export function IntegrationList({ websiteId }: { websiteId: string }) {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: IntegrationRow[] }>({
    queryKey: ['integrations', websiteId],
    queryFn: () => fetch(`/api/website-analysis/websites/${websiteId}/integrations`).then((r) => r.json()),
  })

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading integrations…</div>
  if (isError || !data?.success) return <div className="p-8 text-sm text-red-600">Failed to load integrations.</div>

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Data sources</h2>
        <p className="text-sm text-muted-foreground">
          Connect analytics, SEO, and behavior tools to power this website's dashboards.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.data.map((row) => (
          <IntegrationCard key={row.provider} row={row} websiteId={websiteId} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Integrations page**

`src/app/(dashboard)/website-analysis/websites/[id]/integrations/page.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'
import { IntegrationList } from '@/components/website-analysis/integrations/integration-list'

export default async function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('website_analysis:view')
  const { id } = await params
  return <IntegrationList websiteId={id} />
}
```

- [ ] **Step 6: Commit**

```bash
npx tsc --noEmit
git add src/components/website-analysis/integrations src/app/\(dashboard\)/website-analysis/websites/\[id\]/integrations
git commit -m "feat(website-analysis): add functional integrations tab with connect stub + disconnect"
```

---

## Task 17: Edit and Compare pages

**Files:**
- Create: `src/app/(dashboard)/website-analysis/websites/[id]/edit/page.tsx`
- Create: `src/app/(dashboard)/website-analysis/compare/page.tsx`
- Create: `src/components/website-analysis/websites/website-delete-dialog.tsx`

- [ ] **Step 1: Edit page (server fetches, passes to form)**

`src/app/(dashboard)/website-analysis/websites/[id]/edit/page.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { WebsiteForm } from '@/components/website-analysis/websites/website-form'

export default async function EditWebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('website_analysis:edit')
  const { id } = await params

  const w = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!w) notFound()

  return (
    <WebsiteForm
      mode="edit"
      websiteId={id}
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
```

- [ ] **Step 2: Compare page (empty state — Phase 5 delivers the feature)**

`src/app/(dashboard)/website-analysis/compare/page.tsx`:

```tsx
import { requirePermission } from '@/lib/auth-utils'
import { EmptyStateNoData } from '@/components/website-analysis/shared/empty-state-no-data'

export default async function ComparePage() {
  await requirePermission('website_analysis:view')
  return (
    <EmptyStateNoData
      title="Comparison needs data"
      description="Multi-website comparison unlocks once two or more websites have at least one connected data source. Coming in a later release."
      primaryAction={{ href: '/website-analysis/websites', label: 'Back to websites' }}
    />
  )
}
```

- [ ] **Step 3: Delete confirmation dialog (archive)**

`src/components/website-analysis/websites/website-delete-dialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  websiteId: string
  websiteName: string
}

export function WebsiteDeleteDialog({ open, onOpenChange, websiteId, websiteName }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)
  const m = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/website-analysis/websites/${websiteId}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok || !j.success) throw new Error(j.error || 'Delete failed')
    },
    onMutate: () => setPending(true),
    onSettled: () => setPending(false),
    onSuccess: () => {
      toast.success(`"${websiteName}" archived`)
      qc.invalidateQueries({ queryKey: ['websites'] })
      onOpenChange(false)
      router.push('/website-analysis/websites')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive "{websiteName}"?</DialogTitle>
          <DialogDescription>
            The website will be hidden from the active list. Its historical data is preserved and it can be restored later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="destructive" onClick={() => m.mutate()} disabled={pending}>
            {pending ? 'Archiving…' : 'Archive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Wire delete button into the edit page**

Replace `src/app/(dashboard)/website-analysis/websites/[id]/edit/page.tsx` with the version below (adds a client wrapper with the delete button beside the form).

Create `src/components/website-analysis/websites/website-edit-shell.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { WebsiteForm } from './website-form'
import { WebsiteDeleteDialog } from './website-delete-dialog'
import type { CreateWebsiteInput } from '@/lib/validators/website-analysis'

interface Props {
  websiteId: string
  websiteName: string
  initial: Partial<CreateWebsiteInput>
}

export function WebsiteEditShell({ websiteId, websiteName, initial }: Props) {
  const [showDelete, setShowDelete] = useState(false)
  return (
    <div className="space-y-6">
      <WebsiteForm mode="edit" websiteId={websiteId} initial={initial} />
      <div className="mx-auto max-w-2xl border-t pt-4">
        <h2 className="mb-2 text-sm font-semibold text-red-600">Danger zone</h2>
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Archive this website
        </Button>
      </div>
      <WebsiteDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        websiteId={websiteId}
        websiteName={websiteName}
      />
    </div>
  )
}
```

And update `src/app/(dashboard)/website-analysis/websites/[id]/edit/page.tsx` to use the shell:

```tsx
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
```

- [ ] **Step 5: Commit**

```bash
npx tsc --noEmit
git add src/app/\(dashboard\)/website-analysis/websites/\[id\]/edit src/app/\(dashboard\)/website-analysis/compare src/components/website-analysis/websites/website-delete-dialog.tsx src/components/website-analysis/websites/website-edit-shell.tsx
git commit -m "feat(website-analysis): add edit page, delete dialog, compare placeholder"
```

---

## Task 18: Sidebar nav entry + i18n keys

**Files:**
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/i18n/messages/en.json`
- Modify: `src/i18n/messages/ar.json`

- [ ] **Step 1: Sidebar icon import + nav group**

In `src/components/layout/sidebar.tsx`, add `Globe` to the lucide-react import list (line 8–17):

```ts
import {
  LayoutDashboard, Users, Building2, UserCircle, Target,
  Briefcase, ListTodo, FileText, Receipt, CreditCard,
  Wallet, Share2, Calendar as CalendarIcon,
  Megaphone, HeadphonesIcon, Settings, Shield, Activity,
  BarChart3, ChevronLeft, ChevronRight, ChevronDown, Bell,
  Handshake, Package, GitBranch, GitMerge, CheckSquare, X,
  Eye, PackageOpen, MessageSquare, HeartPulse, ClipboardList,
  RefreshCw, Layers, FormInput, Crown, Globe,
} from 'lucide-react'
```

Then insert this new navigation group **between** the `nav.marketing` group (line 84–91) and the `nav.support` group (line 92–99):

```ts
  {
    titleKey: 'nav.websiteAnalysisSection',
    items: [
      { titleKey: 'nav.websiteAnalysis', href: '/website-analysis', icon: Globe, permission: 'website_analysis:view' },
    ],
  },
```

- [ ] **Step 2: English i18n keys — append to `src/i18n/messages/en.json`**

Open `src/i18n/messages/en.json`. Add these keys — place them alongside existing `nav.*` entries (merge into the `nav` object) and add a new top-level `websiteAnalysis` object:

```json
{
  "nav": {
    "websiteAnalysisSection": "Website Analysis",
    "websiteAnalysis": "Website Analysis"
  },
  "websiteAnalysis": {
    "title": "Website Analysis",
    "addWebsite": "Add website",
    "noWebsites": "Add your first website",
    "tabs": {
      "overview": "Overview",
      "traffic": "Traffic",
      "behavior": "Behavior",
      "conversions": "Conversions",
      "seo": "SEO",
      "pages": "Pages",
      "devicesGeo": "Devices & Geography",
      "integrations": "Integrations",
      "alerts": "Alerts",
      "reports": "Reports"
    }
  }
}
```

If the existing `nav` object is present (it will be), only merge the two new keys inside it; do not replace the object.

- [ ] **Step 3: Arabic i18n keys — mirror structure in `src/i18n/messages/ar.json`**

```json
{
  "nav": {
    "websiteAnalysisSection": "تحليل المواقع",
    "websiteAnalysis": "تحليل المواقع"
  },
  "websiteAnalysis": {
    "title": "تحليل المواقع",
    "addWebsite": "إضافة موقع",
    "noWebsites": "أضف موقعك الأول",
    "tabs": {
      "overview": "نظرة عامة",
      "traffic": "الزيارات",
      "behavior": "السلوك",
      "conversions": "التحويلات",
      "seo": "تحسين محركات البحث",
      "pages": "الصفحات",
      "devicesGeo": "الأجهزة والجغرافيا",
      "integrations": "التكاملات",
      "alerts": "التنبيهات",
      "reports": "التقارير"
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx src/i18n/messages/en.json src/i18n/messages/ar.json
git commit -m "feat(website-analysis): add sidebar nav entry + EN/AR i18n keys"
```

---

## Task 19: Build, lint, manual smoke verification

**Files:** none — this task only runs verification commands.

- [ ] **Step 1: Typecheck the full project**

Run: `npx tsc --noEmit`
Expected: exit 0 with no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exit 0. Fix any newly introduced lint errors in files we created/modified. Do not fix pre-existing lint errors in files outside the module — those are out of scope.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds. If it fails, read the error and fix in the specific file.

- [ ] **Step 4: Start dev server + manual smoke (signed in as `admin@zainhub.ae` / `admin123`)**

Run: `npm run dev` (or use preview tools if available)

Walk through:

1. Sidebar shows **Website Analysis** entry under a new section. ✓
2. Click it → lands on `/website-analysis/websites` with the empty-state "Add your first website" card. ✓
3. Click "Add website" → form at `/website-analysis/websites/new`. Fill name=`Test Site`, domain=`example.com`. Submit. ✓
4. Redirects to the website's Integrations tab. ✓ All 7 provider cards render. ✓
5. Click **Connect** on GA4 → dialog "Connecting Google Analytics 4 is coming next" appears. ✓
6. Navigate through all 10 sub-tabs → each analytics tab (9 of 10) shows the empty state with a "Go to Integrations" CTA. Integrations is functional. ✓
7. Go back to `/website-analysis/websites` → card for "Test Site" visible. ✓
8. Click card → `/overview` (empty state). Click **Edit** in the header. Change name to `Test Site 2`. Save. ✓
9. In edit page's Danger Zone → Archive. Website disappears from list. ✓
10. Open the Admin → Audit Log module (existing) → verify rows present for `Website` CREATE / UPDATE / ARCHIVE and `WebsiteIntegration` UPDATE (stub connect attempt).

Regression check — open these existing modules and confirm they still render without error:
`/dashboard`, `/leads`, `/opportunities`, `/companies`, `/projects`, `/invoices`, `/tickets`, `/campaigns`, `/admin/users`, `/admin/audit-log`.

- [ ] **Step 5: Commit any fixes made during smoke**

If any file needed a fix: `git commit -am "fix(website-analysis): smoke-test corrections"`
Otherwise: skip.

---

## Task 20: Final review against acceptance criteria

**Files:** none — this task is a checklist pass.

- [ ] **Step 1: Verify each acceptance criterion from spec §13**

For each of the 10 criteria in [spec §13](../specs/2026-04-23-website-analysis-phase-1-design.md), confirm it passes. Any failure → fix and re-commit.

1. Prisma migration ran cleanly — confirmed in Task 4
2. Seed idempotent — confirmed in Task 5
3. Nav visibility gated by `website_analysis:view` — Task 18
4. Add/edit/deactivate/delete websites — Tasks 13, 14, 17
5. 10 sub-tabs present, 9 empty, Integrations functional — Tasks 15, 16
6. Disconnect clears state + audit-logs — Task 10 + 16
7. Connect stub audits with `NOT_IMPLEMENTED_PHASE_1` + shows modal — Task 10 + 16
8. Every mutation writes audit — Tasks 8, 9, 10
9. No existing CRM page broken — Task 19 regression check
10. Typecheck + lint + build pass — Task 19

- [ ] **Step 2: Isolation diff check**

Run: `git diff main --stat`
Expected: the only modified-outside-subtree files are exactly `prisma/schema.prisma`, `prisma/seed.ts`, `src/components/layout/sidebar.tsx`, `src/i18n/messages/en.json`, `src/i18n/messages/ar.json`, plus auto-generated Prisma migration files. If any other existing file appears, audit and justify or revert.

- [ ] **Step 3: Open a PR**

```bash
git push -u origin HEAD
gh pr create --title "feat(website-analysis): Phase 1 — foundation" --body "$(cat <<'EOF'
## Summary
- New fully isolated `Website Analysis` section — data model, CRUD, integrations shell, empty-state UX for 10 sub-tabs
- Spec: `docs/superpowers/specs/2026-04-23-website-analysis-phase-1-design.md`
- Plan: `docs/superpowers/plans/2026-04-23-website-analysis-phase-1.md`

## Scope (Phase 1 only)
- Prisma models: `Website`, `WebsiteIntegration`, `WebsiteSyncLog` + enums
- Permissions: `website_analysis:{view,create,edit,delete,export}` via existing seed pattern
- Routes under `src/app/(dashboard)/website-analysis/`
- API under `src/app/api/website-analysis/`
- Integrations tab: list + disconnect fully functional; Connect is a stub (audit-logged) pending Phase 2 OAuth
- Audit trail on every mutation via existing `AuditLog` infra

## Explicitly deferred (Phases 2–6)
OAuth, data sync, charts, alerts, reports, comparisons, insights.

## Test plan
- [ ] Run `npm run build` — passes
- [ ] `npx tsc --noEmit` — passes
- [ ] Smoke: add → integrations tab → connect stub modal → disconnect → edit → archive
- [ ] Regression: 10 existing modules load without error
- [ ] Audit log shows entries for all mutations

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review

**Spec coverage check — every spec section is covered by a task:**

| Spec section                   | Task(s)        |
| ------------------------------ | -------------- |
| §3 Data Model                  | 1, 2, 3, 4     |
| §4 Permissions                 | 5              |
| §5 Routing Structure           | 12, 13, 14, 15, 16, 17 |
| §6 API Routes                  | 8, 9, 10       |
| §7 UI Components               | 11, 16, 17     |
| §8 Audit Logging               | 8, 9, 10       |
| §9 Navigation                  | 18             |
| §10 Empty States               | 11, 15         |
| §11 Isolation Contract         | 20 (diff check)|
| §13 Acceptance Criteria        | 20             |
| §15 Open Qs (resolved in plan) | 9 (soft-delete), 16 (stub dialog UX), 18 (sidebar placement), 2 (tokens unused) |

**Placeholder scan:** None. Every code block is complete and runnable.

**Type consistency:** `IntegrationProvider` comes from `@/lib/validators/website-analysis`. `ProviderMeta` from `@/lib/website-analysis/providers`. `createWebsiteSchema` / `CreateWebsiteInput` used consistently in Tasks 6, 8, 14, 17. `IntegrationStatus` literal strings in card/badge match enum in Task 2.

**Scope check:** Single phase, single feature branch, single PR. Good.

---

## Execution Handoff

Plan complete and saved to [docs/superpowers/plans/2026-04-23-website-analysis-phase-1.md](../plans/2026-04-23-website-analysis-phase-1.md).

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — I execute tasks in this session using `executing-plans`, batch execution with checkpoints for review.

**Which approach?**
