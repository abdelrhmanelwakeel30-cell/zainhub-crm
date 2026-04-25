# Website Analysis — Phase 1 Design (Foundation)

**Status:** Proposed — awaiting approval
**Date:** 2026-04-23
**Source BRD:** User-provided BRD v1 (Website Analysis module)
**Scope decomposition:** This spec covers **Phase 1 only** of a 6-phase rollout. See §12 for the full roadmap.

---

## 1. Goal of Phase 1

Stand up the **Website Analysis** module as a fully isolated new section inside CRM V3 with:

- A working data model for websites, integrations, and sync logs
- Website CRUD (add / edit / deactivate / delete) with tenant isolation and role-based access
- Integrations management **shell** (UI + data model + disconnect + status display) — **no live OAuth or data sync yet**
- New navigation entry wired through the existing sidebar + i18n
- All analytics sub-tabs present as routed pages with proper **empty-state** UI ("Connect a source to see data")
- Audit logging for every state-changing action
- Zero modifications to existing modules beyond the sidebar entry addition

**Phase 1 explicitly defers:** live OAuth flows, real data sync, KPI computation, charts with real data, alerts, exports, insights engine, comparison logic. Those land in Phases 2–6.

This is the minimum needed so the user can (a) register websites, (b) see the module's full navigation and empty states, (c) preview integration cards, and (d) have the data model ready for Phase 2 sync work.

---

## 2. Core Design Principle

The BRD's **mandatory constraint** is treated as a hard invariant throughout the plan:

> "Do not modify, remove, redesign, refactor, or impact any existing CRM page, module, workflow, logic, permission model, dashboard, or UI component, except only the minimum integration work required..."

Concretely, Phase 1 touches exactly these existing files:

1. `prisma/schema.prisma` — add new `Website*` models + `Tenant` back-relations (append-only)
2. `src/components/layout/sidebar.tsx` — add one nav entry
3. `src/i18n/messages/*.json` — add new translation keys
4. `prisma/seed.ts` — add new permissions + assign to existing roles
5. New migration file

**Nothing else existing is touched.** All new code lives under new directories.

---

## 3. Data Model (Prisma — append to schema.prisma)

Six new models, all tenant-scoped. KPI/analytics record models are deferred to Phase 2+ (empty shells would just add dead tables).

```prisma
model Website {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  domain          String         // normalized (https://example.com, no trailing slash)
  brand           String?
  type            WebsiteType    @default(CORPORATE)
  primaryMarket   String?        // ISO country code or free text
  primaryLanguage String?        // ISO 639-1
  notes           String?
  status          WebsiteStatus  @default(ACTIVE)

  ownerUserId     String?
  ownerUser       User?          @relation("WebsiteOwner", fields: [ownerUserId], references: [id])

  createdById     String
  createdBy       User           @relation("WebsiteCreatedBy", fields: [createdById], references: [id])
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  integrations    WebsiteIntegration[]
  syncLogs        WebsiteSyncLog[]

  @@unique([tenantId, domain])
  @@index([tenantId, status])
  @@index([tenantId, type])
}

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

model WebsiteIntegration {
  id              String                   @id @default(cuid())
  tenantId        String
  tenant          Tenant                   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  websiteId       String
  website         Website                  @relation(fields: [websiteId], references: [id], onDelete: Cascade)

  provider        WebsiteIntegrationProvider
  status          IntegrationStatus        @default(NOT_CONNECTED)

  // Provider-specific identifiers (all optional at Phase 1 — filled in later phases)
  externalAccountId String?                // e.g. GA4 property ID, GSC site URL, Clarity project ID
  externalAccountLabel String?             // human-readable label for UI

  // Encrypted token storage — Phase 1 stores the columns as null;
  // Phase 2 wires OAuth and fills them.
  accessTokenEnc  String?                  // AES-GCM-encrypted
  refreshTokenEnc String?
  tokenExpiresAt  DateTime?
  scopes          String[]                 // granted scopes (empty in Phase 1)

  lastSyncAt      DateTime?
  lastSyncStatus  SyncStatus?
  lastErrorMsg    String?

  connectedById   String?
  connectedBy     User?                    @relation("WebsiteIntegrationConnectedBy", fields: [connectedById], references: [id])
  connectedAt     DateTime?
  disconnectedAt  DateTime?

  createdAt       DateTime                 @default(now())
  updatedAt       DateTime                 @updatedAt

  syncLogs        WebsiteSyncLog[]

  @@unique([websiteId, provider])
  @@index([tenantId, status])
  @@index([tenantId, provider])
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

model WebsiteSyncLog {
  id              String         @id @default(cuid())
  tenantId        String
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  websiteId       String
  website         Website        @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  integrationId   String
  integration     WebsiteIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  status          SyncStatus
  startedAt       DateTime       @default(now())
  finishedAt      DateTime?
  rowsProcessed   Int?
  errorSummary    String?
  errorDetail     Json?
  retryOf         String?        // WebsiteSyncLog.id of the attempt this retries

  @@index([tenantId, websiteId, startedAt])
  @@index([integrationId, startedAt])
}
```

Plus **back-relations on existing `Tenant` and `User`** (append to their relation lists — no field removal, no reordering of existing fields):

- `Tenant.websites Website[]`
- `Tenant.websiteIntegrations WebsiteIntegration[]`
- `Tenant.websiteSyncLogs WebsiteSyncLog[]`
- `User.ownedWebsites Website[] @relation("WebsiteOwner")`
- `User.createdWebsites Website[] @relation("WebsiteCreatedBy")`
- `User.connectedWebsiteIntegrations WebsiteIntegration[] @relation("WebsiteIntegrationConnectedBy")`

**Encryption note:** `accessTokenEnc`/`refreshTokenEnc` columns are added in Phase 1 but unused until Phase 2. The encryption helper (`src/lib/crypto.ts`) is deferred to Phase 2 as well — Phase 1 never writes token values.

---

## 4. Permissions

Added to `prisma/seed.ts` permission catalog and assigned to existing roles. Uses the existing `module:action` convention (see `src/lib/permissions.ts`).

| Permission                        | Description                                | Super Admin | Admin | Marketing Mgr | Analyst | Viewer |
| --------------------------------- | ------------------------------------------ | :---------: | :---: | :-----------: | :-----: | :----: |
| `website_analysis:view`           | View module + analytics                    |      ✓      |   ✓   |       ✓       |    ✓    |   ✓    |
| `website_analysis:write`          | Add/edit websites                          |      ✓      |   ✓   |       ✓       |         |        |
| `website_analysis:delete`         | Delete/archive websites                    |      ✓      |   ✓   |               |         |        |
| `website_analysis:integrations`   | Connect/disconnect data sources            |      ✓      |   ✓   |       ✓       |         |        |
| `website_analysis:reports`        | Export reports                             |      ✓      |   ✓   |       ✓       |    ✓    |        |
| `website_analysis:alerts:config`  | Configure alerts (Phase 5)                 |      ✓      |   ✓   |       ✓       |         |        |

Role-to-permission assignment is a one-time seed change; existing roles get these permissions appended. No existing permissions are modified or removed.

---

## 5. Routing Structure

All routes live under `src/app/(dashboard)/website-analysis/`:

```
website-analysis/
├── layout.tsx                     # Sub-nav tabs, shared header
├── page.tsx                       # Redirects → /website-analysis/websites
├── websites/
│   ├── page.tsx                   # List of websites + KPI snapshot cards
│   ├── new/page.tsx               # Add website form
│   └── [id]/
│       ├── layout.tsx             # Tabs: Overview | Traffic | Behavior | Conversions | SEO | Pages | Devices&Geo | Integrations | Alerts | Reports
│       ├── page.tsx               # Redirects → overview
│       ├── overview/page.tsx      # Phase 1: empty-state, "Connect a source"
│       ├── traffic/page.tsx       # Phase 1: empty-state
│       ├── behavior/page.tsx      # Phase 1: empty-state
│       ├── conversions/page.tsx   # Phase 1: empty-state
│       ├── seo/page.tsx           # Phase 1: empty-state
│       ├── pages/page.tsx         # Phase 1: empty-state
│       ├── devices-geo/page.tsx   # Phase 1: empty-state
│       ├── integrations/page.tsx  # Phase 1: FUNCTIONAL — list + connect/disconnect UI
│       ├── alerts/page.tsx        # Phase 1: empty-state
│       ├── reports/page.tsx       # Phase 1: empty-state
│       └── edit/page.tsx          # Edit website form
└── compare/page.tsx               # Phase 1: empty-state, "Needs 2+ synced websites"
```

Every page uses `await requirePermission('website_analysis:view')` (or tighter for write/integrations routes).

---

## 6. API Routes

Under `src/app/api/website-analysis/`:

| Method + Path                                                  | Permission                          | Phase 1 behavior                                                             |
| -------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `GET  /api/website-analysis/websites`                          | `website_analysis:view`             | List tenant's websites + counts                                              |
| `POST /api/website-analysis/websites`                          | `website_analysis:write`            | Create                                                                       |
| `GET  /api/website-analysis/websites/[id]`                     | `website_analysis:view`             | Fetch detail + integrations summary                                          |
| `PATCH /api/website-analysis/websites/[id]`                    | `website_analysis:write`            | Update                                                                       |
| `DELETE /api/website-analysis/websites/[id]`                   | `website_analysis:delete`           | Soft-delete (`status = ARCHIVED`) unless `?hard=true` and caller is SuperAdmin |
| `GET  /api/website-analysis/websites/[id]/integrations`        | `website_analysis:view`             | List all 7 providers with status (CONNECTED / NOT_CONNECTED / …)             |
| `POST /api/website-analysis/websites/[id]/integrations/[provider]/connect` | `website_analysis:integrations` | **Phase 1 stub**: returns `{ ok: false, reason: 'NOT_IMPLEMENTED_PHASE_1' }` and records an audit entry. Phase 2 replaces with real OAuth start. |
| `POST /api/website-analysis/websites/[id]/integrations/[provider]/disconnect` | `website_analysis:integrations` | Sets status `NOT_CONNECTED`, clears tokens, audit-logs                       |
| `GET  /api/website-analysis/websites/[id]/sync-logs`           | `website_analysis:view`             | List sync log entries (empty in Phase 1)                                     |

All handlers:

- Use `requireApiPermission()` per the existing pattern
- Filter every query by `tenantId` from the session (no path-param tenant shortcut)
- Zod-validate request bodies via schemas in `src/lib/validators/website-analysis.ts`
- Emit `AuditLog` rows on every mutation (entity types: `Website`, `WebsiteIntegration`)

---

## 7. UI Components

Under `src/components/website-analysis/`:

```
shared/
  empty-state-no-data.tsx          # "Connect a source to see data" with CTA to Integrations tab
  empty-state-no-website.tsx       # "Add your first website"
  kpi-card-skeleton.tsx            # Placeholder for Phase 2 KPI cards
  sync-status-badge.tsx            # Renders IntegrationStatus + lastSyncAt
  provider-logo.tsx                # GA4 / GSC / Clarity / etc. logos
websites/
  website-list.tsx                 # Table of websites (server component with search/filter)
  website-form.tsx                 # Add/edit form (react-hook-form + zod)
  website-delete-dialog.tsx
integrations/
  integration-card.tsx             # One per provider: logo, status badge, connect/disconnect button
  integration-list.tsx             # Grid of 7 provider cards
  disconnect-dialog.tsx
layout/
  website-analysis-subnav.tsx      # Horizontal tab strip for website detail
```

**Styling**: uses existing shadcn/ui primitives, Tailwind 4, and existing `src/components/ui/*` — no new design primitives introduced.

---

## 8. Audit Logging

Every state change writes to `AuditLog` via the existing `src/lib/audit.ts` helper, with `sourceModule = 'website-analysis'`:

| Action                  | entityType            | entityId                | Notes                               |
| ----------------------- | --------------------- | ----------------------- | ----------------------------------- |
| Website created         | `Website`             | website.id              | afterValue snapshot                 |
| Website updated         | `Website`             | website.id              | changes diff + before/after         |
| Website deactivated     | `Website`             | website.id              | action = `UPDATE`, status change    |
| Website deleted         | `Website`             | website.id              | action = `DELETE`                   |
| Integration connect attempt (Phase 1 stub) | `WebsiteIntegration` | integration.id | logged even though stubbed |
| Integration disconnected | `WebsiteIntegration` | integration.id         |                                      |

---

## 9. Navigation

Add a new section to `src/components/layout/sidebar.tsx` between **Marketing** and **Support** sections:

```ts
{
  titleKey: 'nav.sections.websiteAnalysis',
  items: [
    { titleKey: 'nav.websiteAnalysis', href: '/website-analysis', icon: Globe, permission: 'website_analysis:view' },
  ],
},
```

Single top-level entry — the sub-nav (10 tabs) is handled inside the module's own `layout.tsx`, matching how the admin section presents nested routes.

Icon: `Globe` from `lucide-react` (already imported elsewhere).

i18n keys added to `en.json`, `ar.json` (and any other existing locales): `nav.sections.websiteAnalysis`, `nav.websiteAnalysis`, plus module-internal keys under `websiteAnalysis.*`.

---

## 10. Empty States (Phase 1 UX contract)

Every analytics tab in Phase 1 renders a single component:

```
<EmptyStateNoData
  title="No data yet"
  description="Connect Google Analytics 4, Search Console, or another data source to start seeing analytics for this website."
  primaryAction={{ href: `/website-analysis/websites/${id}/integrations`, label: "Go to Integrations" }}
/>
```

The **Integrations** tab is the one tab that renders real UI in Phase 1: provider cards with status badges, a Connect button that (Phase 1) opens a modal explaining "Connections go live in the next release", and a Disconnect button that fully works (since it only clears DB state).

This gives the user an end-to-end walkable UX in Phase 1 without any fake data.

---

## 11. Isolation Contract

Things that **must not change** in Phase 1:

- Any file under `src/app/(dashboard)/` **except** the new `website-analysis/` subtree
- Any file under `src/app/api/` **except** the new `website-analysis/` subtree
- `src/components/**` **except** the new `website-analysis/` subtree and the single sidebar edit
- Any existing Prisma model **except** appending relation fields to `Tenant` and `User`
- The existing permission catalog in seed **except** appending new entries
- `middleware.ts`, `next.config.ts`, `auth.ts`, theme, layout shell

The code review step (§ in the plan) will diff the branch against `main` and explicitly verify this boundary.

---

## 12. Phase Roadmap (for context only — not built in this spec)

| Phase | Scope                                                                 | Ships            |
| :---: | --------------------------------------------------------------------- | ---------------- |
| **1** | **Foundation (this spec)** — models, CRUD, integration shell, empty states | **Now**       |
|   2   | GA4 OAuth + real sync + Overview + Traffic tabs with real data        | Next cycle       |
|   3   | Search Console connector + SEO tab + Pages tab                        |                  |
|   4   | Clarity + Behavior tab + Conversions + Devices/Geography              |                  |
|   5   | Alerts + Reports export (PDF/Excel/CSV) + Compare + Smart Insights    |                  |
|   6   | Remaining connectors: GTM, Google Ads, Meta Pixel, LinkedIn Insight   |                  |

Each subsequent phase goes through its own brainstorm → spec → plan → implementation cycle.

---

## 13. Acceptance Criteria for Phase 1

Phase 1 is "done" when:

1. Prisma migration runs cleanly against the existing dev DB
2. Seed applies new permissions idempotently
3. User with `website_analysis:view` sees the new nav entry; user without it does not
4. User with `website_analysis:write` can add, edit, deactivate, delete websites
5. Website detail page shows all 10 sub-tabs; 9 render empty states; Integrations tab renders functional provider cards
6. Disconnect action clears integration state and audit-logs
7. Connect action (stub) records audit log with `NOT_IMPLEMENTED_PHASE_1` reason and surfaces a helpful modal to the user
8. Every mutation writes an `AuditLog` row
9. No existing CRM page's behavior changes (regression-tested by opening 10 existing modules and confirming they render)
10. Typecheck + lint pass; build succeeds

---

## 14. Explicit Non-Goals (Phase 1)

- No real OAuth or token exchange
- No real data fetching from any third party
- No KPI computation
- No charts with real data (skeletons only)
- No alerts logic
- No report generation
- No comparison logic
- No insights engine
- No scheduled/cron sync jobs
- No encryption helper (deferred to Phase 2 with real OAuth)

---

## 15. Open Questions for User Review

Please confirm or override these defaults before we move to the implementation plan:

1. **Hard vs soft delete:** Default is soft-delete (archive) for non-SuperAdmin. OK?
2. **Sidebar placement:** New section between Marketing and Support. OK, or prefer inside Marketing?
3. **Role grants:** Default mapping in §4 assumes Marketing Manager gets write + integrations. OK?
4. **Encryption deferral:** Token columns exist but are unused until Phase 2. OK, or wire encryption now?
5. **Connect-button stub UX:** Phase 1 shows a "Coming next release" modal. Alternative: hide Connect buttons entirely. Preference?
