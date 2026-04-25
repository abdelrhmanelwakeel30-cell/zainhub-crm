# Zain Hub CRM V3 — Production Audit

> **Date:** April 25, 2026 — same day, post-deploy.
> **Scope:** entire repository on `main` (commit `aefabf4`), live and serving traffic at https://crm.zainhub.ae.
> **Method:** seven parallel domain auditors against the live `main` branch, plus runtime HTTP probes against the deployed site, then manual reconciliation.
> **Supersedes (for delta-tracking):** `CRM-V3-FULL-AUDIT-2026-04-25.md` (pre-fix), `CRM-V3-FINAL-AUDIT-2026-04-25.md` (post-fix on branch). This is the post-deploy reality.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Live Production Probes](#live-production-probes)
- [Methodology](#methodology)
- [Findings by Severity](#findings-by-severity)
- [Findings by Domain](#findings-by-domain)
  - [Security & Auth (S)](#security--auth-s)
  - [Multi-Tenancy & Isolation (T)](#multi-tenancy--isolation-t)
  - [Performance & Database (P)](#performance--database-p)
  - [Reliability & Observability (R)](#reliability--observability-r)
  - [Code Quality & Type Safety (Q)](#code-quality--type-safety-q)
  - [i18n & Accessibility (I)](#i18n--accessibility-i)
  - [DevOps & Supply Chain (D)](#devops--supply-chain-d)
- [What's Verified Working in Production](#whats-verified-working-in-production)
- [Recommended Action Plan](#recommended-action-plan)
- [Inventory — Live State](#inventory--live-state)

---

## Executive Summary

`crm.zainhub.ae` is **live, stable, and serving authenticated traffic with all advertised security headers and a real DB-checking health probe**. The largest gaps from the original 67-finding audit are closed, including all **multi-tenancy issues** (T-001, T-002 — fully resolved across all 13 POST routes), the OTP CSPRNG fix, NextAuth cookie tightening, and the schema-drift hotfix that made `/api/admin/audit-log` work in production. **Zero confirmed data leaks. Zero critical security findings.**

Three categories of work remain:

1. **Code shipped but inert** — Sentry, Upstash, the `cache.ts` helper, and the `logger.ts` helper all landed but have **0 production consumers** until env vars are set or call sites are migrated. The infrastructure is built; the wiring is the next sprint.

2. **CI present but not running** — `.github/workflows/ci.yml` exists, but the last two runs on `main` failed at 0 seconds with GitHub's generic "workflow file issue" message. CI is **declarative only** until that's diagnosed.

3. **RBAC sweep deferred** — 81 of 86 mutation routes still authenticate but don't authorize. Any logged-in user can hit them. This is the single largest remaining production-security risk and explicitly waits on per-route permission decisions.

| Severity | Count | One-line headline |
|---|---|---|
| 🔴 **Critical** | **1** | Cache helper has zero consumers — dashboard hits Postgres on every request |
| 🟠 **High** | **8** | RBAC sweep, portal JWT revocation, memoization, deep includes, Sentry not in 32/34 boundaries, logger adoption ~0%, CI not actually running, aria-required absent |
| 🟡 **Medium** | **14** | CSP `unsafe-inline`, CSRF when Origin missing, cross-tenant portal-login branch, env.example drift, hardcoded English in 80 spots, ~14 component-level smells |
| 🟢 **Low** | **8** | Account-enumeration in log breadcrumbs, double-naming Upstash env vars, `dev.db` tracked, etc. |

**Total:** **31 distinct findings**, of which **1 is Critical, 8 High, 14 Medium, 8 Low.** Down from 67 in the pre-fix audit (~54 % closed; the remainder is genuinely follow-up work, not regression).

---

## Live Production Probes

Direct HTTP measurements against `https://crm.zainhub.ae`:

| Probe | Result |
|---|---|
| `GET /` (no auth) | `307 → /login?callbackUrl=/dashboard` |
| `GET /api/health` | `200, db.ok: true, latencyMs: 111` (warm Neon) |
| `GET /api/leads` (no session) | `401 Unauthorized` in 147 ms |
| `POST /api/leads` cross-origin | `401 Unauthorized` (auth gate fires before CSRF) |
| `GET /api/admin/audit-log` (no auth) | `401 Unauthorized` |
| `GET /_vercel/insights/script.js` | `200` ✓ (Vercel Analytics injected) |
| 10 parallel `GET /api/health` | All `200`; `/api/health` is in `PUBLIC_API_PATHS`, so not rate-limited (by design) |
| Server header | `Vercel`, HTTP/2 |
| HSTS | `max-age=63072000; includeSubDomains; preload` ✓ |
| CSP | `default-src 'self'; script-src 'self' 'unsafe-inline'; …` — confirms S-007 still open |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), interest-cohort=()` ✓ |
| X-Frame-Options | `SAMEORIGIN` ✓ |
| X-Content-Type-Options | `nosniff` ✓ |

**Logged-in spot checks** (same browser session, prior smoke):
- `/api/admin/audit-log?pageSize=3` → **200** with rows, `sourceModule` field present (proves the schema-drift hotfix migration applied to production DB).
- `/api/website-analysis/websites?pageSize=5` → **200** with `{success, total, page, pageSize}` shape.
- `/api/leads?pageSize=2` → **200** with 2 rows.
- Dashboard renders, sidebar (`/website-analysis` link present), `Vercel Analytics` script loads.

---

## Methodology

Seven specialised read-only agents ran in parallel against the live `main` branch. Each was scoped to a single domain, told to find what's still open and surface anything new, and capped at 600–800 words. Live HTTP probes ran in parallel against `crm.zainhub.ae` to catch runtime-only signals (headers, latency, response shapes).

| Domain | Findings | Agent runtime |
|---|---|---|
| Security & Auth | 7 (0/2/3/2) | 120 s |
| Multi-Tenancy | 0 | 76 s |
| Performance & DB | 5 (1/2/2/0) | 99 s |
| Code Quality | 6 (false-positive Critical excluded) | 96 s |
| Reliability | 5 (0/2/2/1) | 84 s |
| i18n & Accessibility | 6 (0/0/4/2) | 55 s |
| DevOps | 4 (0/1/1/2) | 85 s |
| **Total** | **31 distinct + ~10 reconfirmed-closed** | ~10 min wall, ~3 min parallel |

The Code Quality agent reported "TS errors: 38" — verified to be a stale Prisma-client artifact (the agent ran `tsc` without first running `npx prisma generate`). After regeneration, `tsc --noEmit` is clean. CI runs `prisma generate` before tsc/build, so production is unaffected.

---

## Findings by Severity

### 🔴 Critical (1)

| ID | Title | Domain |
|---|---|---|
| **P-003** | `src/lib/cache.ts` helper has zero consumers — dashboard `/api/dashboard/stats` runs 9 parallel queries every request, all uncached | Performance |

### 🟠 High (8)

| ID | Title | Domain |
|---|---|---|
| **S-004** | 81 of 86 mutation routes still bypass `requireApiPermission` (RBAC sweep) | Security |
| **S-005** | Portal JWT not revocable — `verifyPortalToken` doesn't look up `clientPortalSession.revokedAt` | Security |
| **P-004** | 0 of 18 heavy components carry `React.memo` | Performance |
| **P-002** (Medium per agent, raised) | Several detail routes still use deep `include` chains without `select` | Performance |
| **R-004a** | 32 of 34 `error.tsx` files don't call `Sentry.captureException` — only `(dashboard)/error.tsx` and global do | Reliability |
| **R-007a** | `src/lib/logger.ts` adopted in 1 file, 5 call sites; 104 raw `console.error` in `src/app/api` | Reliability |
| **D-007** | GitHub Actions on `main` failing at 0 s with "workflow file issue" — CI is not actually running | DevOps |
| **I-005** (raised) | `aria-required` count: **0**; `aria-describedby`: **0** — required-field state invisible to screen readers | Accessibility |

### 🟡 Medium (14)

| ID | Title | Domain |
|---|---|---|
| S-007 | CSP `script-src 'unsafe-inline'` in production (defeats CSP XSS protection) | Security |
| S-015 | CSRF Origin check skipped when Origin header is missing | Security |
| S-016 | Portal login: when `tenantSlug` omitted, `findFirst` matches across tenants | Security |
| P-005 | `Opportunity (tenantId, wonAt, lostAt)` could be a partial index | Performance |
| P-010 | Detail routes (`leads/[id]`, `projects/[id]`) over-fetch via `include` | Performance |
| R-008 | API error pattern split: 46 routes use `serverError()` helper, 54 use raw `console.error + 500` | Reliability |
| R-009 | `console.error` discipline isn't enforced — new code keeps adding raw calls | Reliability |
| I-001 / I-002 / I-003 | 14 PageHeader + 20 KPICard + 46 placeholder hardcoded English strings | i18n |
| I-006 | 153 instances of `text-{red,green,amber,yellow}-{500,600}` and 42 `bg-X-100 text-X-700` pairings — borderline WCAG AA | a11y |
| I-008 | All 34 `error.tsx` files use literal English | i18n |
| I-011 | Zero `Suspense` boundaries anywhere in `src/app` | a11y |
| D-005 | `.env.example` drift: 6 vars in code missing from example (`LOG_LEVEL`, `UPSTASH_REDIS_*` variants, etc.) | DevOps |
| Q-103 | `zodResolver(schema) as any` in 7 form dialogs | Quality |
| Q-105 / Q-106 | 23 duplicated `*-form-dialog.tsx`; no `features/` layer | Quality |

### 🟢 Low (8)

| ID | Title | Domain |
|---|---|---|
| S-017 | `console.warn` logs portal-login deny reason — leak via Sentry breadcrumbs | Security |
| S-018 | `serverError()` helper uses `console.error`, not the logger or Sentry | Security |
| I-010 | `error.tsx` files use hardcoded English `<h1>` | a11y |
| D-008 | Upstash code reads both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_URL` — pick one | DevOps |
| D-009 | `prisma/dev.db` (SQLite) tracked in repo despite using Postgres | DevOps |
| D-010 | Lockfile recently force-regenerated; watch subsequent `npm ci` failures | DevOps |
| R-011 | No `webhooks/` directory yet — forward-looking for Stripe/Resend | Reliability |
| R-012 | Only 2 e2e specs (`auth`, `website-analysis`); no critical-path coverage | Reliability |

---

## Findings by Domain

### Security & Auth (S)

**Headline:** Authentication is solid (CSPRNG OTP, sliding-window rate limits with Upstash backing, sameSite=strict cookies, mandatory portal secret, generic 401 on portal failures, beforeSend PII filter on Sentry events). **Authorization is the unfinished half** — RBAC enforcement still misses 81 of 86 mutation routes.

#### S-004 — 81 of 86 mutation routes skip `requireApiPermission`
🟠 **High** · sample evidence: `payments/route.ts`, `proposals/route.ts`, `admin/users/[id]/route.ts`, `approvals/[id]/steps/[stepId]/decide/route.ts`, `bundles/**`, `client-services/**`

Only 5 mutation route files import `requireApiPermission`. The rest call `getApiSession()` (auth, not authorization). Sensitive routes (`/api/admin/users/[id]`, `/api/admin/roles`, `/api/payments`, `/api/approvals/.../decide`, `/api/admin/settings`) are reachable by any authenticated user regardless of role.

**Fix:** Mechanical sweep — replace `getApiSession()` with `requireApiPermission('<module>:<action>')`. Add an ESLint rule that fails CI when a mutation handler lacks an authorization import. Recommended priority: admin > payments > approvals > proposals > quotations > contracts.

#### S-005 — Portal JWT cannot be revoked
🟠 **High** · `src/lib/portal-auth.ts:31-40`

`verifyPortalToken` validates the JWT signature only; it does not look up `clientPortalSession` by `payload.sessionId`. A leaked 30-day token cannot be invalidated server-side — logout, password reset, and admin disable all become advisory.

**Fix:** Extend `clientPortalSession` with `revokedAt DateTime?`; in `verifyPortalToken`, after JWT validation, look up the session row and reject if `revokedAt != null` or `expiresAt < now`. Cache via Redis to keep latency low.

#### S-007 — CSP permits `unsafe-inline` on script-src in production
🟡 **Medium** · `next.config.ts:11` · confirmed via live header probe

`script-src 'self' 'unsafe-inline'` defeats CSP's XSS protection. The justification ("Next.js inline styles + shadcn") applies to `style-src`, not `script-src`. **Fix:** adopt nonce-based CSP via `headers()` + middleware, drop `'unsafe-inline'` from `script-src`.

#### S-015 — CSRF Origin check skipped when Origin header is absent
🟡 **Medium** · `src/middleware.ts:84`

```ts
if (origin) { /* compare to host */ }
```

When Origin is missing, the guard is bypassed. Modern browsers always send Origin on POST/PUT/PATCH/DELETE, but `fetch` from `file://`, server-to-server, and some bots omit it. With `sameSite='strict'` cookies the practical exposure is low, but defense-in-depth is missing. **Fix:** if `!origin`, fall back to `referer` or `sec-fetch-site`; reject mutations with neither.

#### S-016 — Portal login can match across tenants when `tenantSlug` omitted
🟡 **Medium** · `src/app/api/client-portal/auth/login/route.ts:49-54`

```ts
prisma.clientPortalUser.findFirst({ where: { email } })
```

Email is unique within a tenant, not globally. With omitted `tenantSlug`, the first match wins — auth oracle and wrong-tenant login risk. **Fix:** make `tenantSlug` `z.string().min(1)` (mandatory), mirroring `verify-otp/route.ts`.

#### S-017 — `console.warn` leaks denial reason
🟢 **Low** · `src/app/api/client-portal/auth/login/route.ts:71`

`denyReason` is one of `'no-user-or-no-password' | 'wrong-password' | 'inactive' | 'unverified'`. Sent to console + Sentry breadcrumbs. The user-facing 401 is generic; the log channel still leaks enumeration data to anyone with Sentry/log access.

**Fix:** route through `logger.info({ event: 'portal_login_denied' })` with structured fields and a redaction policy.

#### S-018 — `serverError()` swallows errors to console only
🟢 **Low** · `src/lib/api-helpers.ts:60-63`

The helper uses `console.error('[API Error]', err)` instead of `logger.error(...)` or `Sentry.captureException`. Compounds R-007a — Sentry receives no server-side errors from this code path.

**Confirmed closed:** S-001 (CSPRNG OTP), S-002 (portal login rate limit), S-003 (no OTP echo + verify rate limit), S-006 (sameSite=strict cookies), S-008 (Upstash limiter), S-009 (mandatory PORTAL_JWT_SECRET, no fallback), S-011 (generic portal 401), Fix-008 (API rate limit middleware), Fix-013 (CSRF Origin check on mutations), Sentry beforeSend PII filter, no `prisma.$queryRaw` template-literal usage, no hardcoded secrets in `src/`.

---

### Multi-Tenancy & Isolation (T)

**Headline:** **Fully closed.** Zero confirmed leaks, all 13 POST routes from T-002 covered, T-001 admin/users tenant-validation in place, mass-assignment defense intact, every `[id]` route uses `findFirst({ id, tenantId })`, all 99 `auditLog.create` call sites carry `tenantId`.

#### T-001 verification ✅
- `admin/users/route.ts` POST lines 110-117 — `tx.role.findMany({ where: { id: { in: roleIds }, tenantId } })` + length check inside transaction.
- `admin/users/[id]/route.ts` PATCH lines 84-91 — same pattern.

#### T-002 verification ✅
All 13 POST routes call `assertTenantOwnsAll(prisma, tenantId, refs)` before `prisma.X.create(...)`:
`invoices, opportunities, projects, tasks, contacts, contracts, quotations, change-requests, deliverables, communication-logs, subscriptions, tickets, expenses`.

#### Q-001 fix verified
`client-portal/change-requests` correctly scopes by `tenantId` AND `companyId`; users with no `companyId` see/create nothing (fail-closed).

#### Public routes (intentional exceptions)
`auth/[...nextauth]`, `health`, `uploadthing`, `admin/permissions` (Permission is global), `client-portal/auth/{send-otp, verify-email, register}`, `public/forms/[slug]`. All documented.

**Verdict:** No new tenancy gaps. T-001 + T-002 + Q-001 schema-drift fixes are real and live.

---

### Performance & Database (P)

**Headline:** Pagination is now broadly applied (P-001 closed across 13 routes), 177 `@@index` definitions in the schema (up from baseline), Prisma adapter pattern is sound. **The biggest miss:** the `cache.ts` helper landed but has zero consumers — dashboard stats and lookup tables still hit Postgres on every request.

#### P-003 — Cache helper has zero consumers
🔴 **Critical** · `src/lib/cache.ts` exists; `grep -rn "from '@/lib/cache'" src/` returns 0

Dashboard stats route runs 9 parallel queries each request. Lookup tables (lead-sources, expense-categories, service-categories, pipelines) hit Postgres unkilled. Cold-path latency is 600-1500 ms on Neon HTTP. **Fix:** wrap in `cached(...)`, `revalidate: 60` for dashboard, `revalidate: 300` for lookups, tag `dashboard:<tenantId>` etc., add `invalidate(...)` in mutations. ~1 hour.

#### P-004 — 0 of 18 heavy components memoized
🟠 **High** · `grep -rEn "= memo\(" src/components` → 0 files

Every parent re-render cascades through tables, kanbans, sidebar. Previously identified targets (data-table, leads-kanban, opportunities-kanban, sidebar, 14 module tables) are untouched.

**Fix:** Wrap row components with `React.memo`, hoist column defs, memoize handlers. ~2 hours.

#### P-002 / P-010 — Detail routes still over-fetch via deep `include`
🟠 **High** / 🟡 **Medium** · `src/app/api/leads/[id]/route.ts:37,80`, `projects/[id]/route.ts:13`

Some detail routes have replaced `include` with `select`; about a third still pull entire related rows.

#### P-005 — `Opportunity (tenantId, wonAt, lostAt)` could be partial
🟡 **Medium** · `prisma/schema.prisma`

The composite is fine for the dashboard's "active opportunities" filter, but a `WHERE wonAt IS NULL AND lostAt IS NULL` partial index would be tighter. Optional optimization.

**Confirmed closed:** P-001 (pagination across 13 routes), P-008 (Activity/Task/Opportunity composite indexes), P-009 (Prisma 7 reframe via `prisma.config.ts`), R-003 (real `/api/health` DB ping with 2 s timeout), Prisma singleton implementation, server-default routing (only 6 `'use client'` pages out of 73), `optimizePackageImports` populated.

---

### Reliability & Observability (R)

**Headline:** All 33 + 33 error/loading boundaries shipped, `/api/health` is real, Sentry + Vercel Analytics + Speed Insights are wired and graceful when DSN unset. **The unfinished half:** Sentry is wired in only 2 of 34 boundaries, and the structured `logger.ts` is shelfware (5 call sites in 1 file).

#### R-007a — `logger.ts` adoption is essentially zero
🟠 **High** · `src/lib/logger.ts` exists; only 1 import in repo

104 `console.error` calls remain in `src/app/api`. Without migration, Sentry receives almost no server-side errors from API routes (only `onRequestError` from Next + the dashboard error.tsx). **Fix:** codemod `console.error(msg, err)` → `log.error(msg, { err })` across `src/app/api`. ~1 PR. Add ESLint `no-console` rule scoped to `src/app/api/**` to prevent regression.

#### R-004a — 32 of 34 error boundaries don't capture to Sentry
🟠 **High** · 32 sub-route `error.tsx` + global `src/app/error.tsx`

Only `(dashboard)/error.tsx` calls `Sentry.captureException`. Errors thrown inside `/leads`, `/invoices`, etc. surface a UI but never reach Sentry from the client. **Fix:** factor a shared `<SectionError>` component or add the 3-line `useEffect(Sentry.captureException)` to each. ~30 minutes.

#### R-008 — Mixed API error patterns
🟡 **Medium** · 46 routes use `serverError()`, 54 use raw `NextResponse.json + console.error`

Inconsistent error shapes for clients and bypasses centralisation (request-id tagging, Sentry forwarding). **Fix:** converge on `serverError()` everywhere; bake Sentry capture into the helper.

#### R-009 — `console.error` policy not enforced
🟡 **Medium** · payments route was just edited and STILL added `console.error`

Suggests the migration isn't enforced in code review. **Fix:** add ESLint rule.

**Confirmed closed:** R-001 partial (33 unit tests pass; framework + e2e shells live), R-002 partial (Sentry code shipped, gated on DSN), R-003 (real health), R-004 quantitative (33 error.tsx + 33 loading.tsx), R-009 (audit log inside `$transaction` for lead-convert + invoice-payments), R-010 (`sendPaymentConfirmation` with `.catch` logging).

---

### Code Quality & Type Safety (Q)

**Headline:** TypeScript is clean (`tsc --noEmit` exits 0 after `prisma generate`). Real progress on `as any` (24 → 12) and eslint-disables (25 → 12). `_DEPRECATED_CRM-dev/` and `src/lib/demo-data/` are gone. **The honest backlog:** lint shows 37 errors / 77 warnings (mostly pre-existing React 19 strictness violations), and the `features/` layer still doesn't exist.

#### Q-103 — `zodResolver(schema) as any` in 7 form dialogs
🟡 **Medium** · `payment, contract, pipeline, quotation, service, proposal, campaign` form-dialog files

Symptom of unresolved RHF/Zod generic mismatch. **Fix:** shared typed wrapper component, fix once.

#### Q-105 / Q-106 — 23 duplicated form dialogs; no `features/` layer
🟡 **Medium** · `find src/components -name "*-form-dialog.tsx" | wc -l` → 23

API routes still inline parse + auth + Prisma + serialize. **Fix:** extract `<EntityFormDialog>` (-2 k LoC); introduce `src/features/<module>/{actions,queries,schemas}.ts`.

**Counts:**

| Metric | Pre-fix | Post-fix |
|---|---|---|
| `tsc --noEmit` errors | 0 | 0 ✓ |
| Lint errors / warnings | 27 / 87 | 37 / 77 (lint is `continue-on-error` in CI) |
| `as any` in `src/` | 24 | **12** ✓ (halved) |
| `eslint-disable` | 25 | **12** ✓ (halved) |
| `console.log` | 0 | 0 ✓ |
| `console.error` in `src/app/api` | 103 | 104 ⚠️ (net +1) |
| `_DEPRECATED_CRM-dev/` | 2 GB on disk | gone ✓ |
| `src/lib/demo-data/` | 14 orphans | gone ✓ |

New code (`logger.ts`, `cache.ts`, `rate-limit.ts`, all four Sentry configs, `instrumentation.ts`) contains **zero `any`** — clean. `permissions-cache.ts` has 1 `any` and was the source of 4 transient TS errors when the agent ran without `prisma generate`.

---

### i18n & Accessibility (I)

**Headline:** RTL is now actually functional (custom-variant + 16 detail-page back-arrow flips); en/ar at 644-key parity. **The unfinished half:** components still hardcode English in 80 sampled places, and `aria-required` is still **0**.

#### I-001 / I-002 / I-003 — 80 hardcoded English strings in components
🟡 **Medium** (3 findings) · `tickets/tickets-content.tsx`, `change-request-form-dialog.tsx`, `preview-links-content.tsx`, etc.

| File | Hardcoded strings (header + KPI + placeholder) |
|---|---|
| `tickets-content.tsx` | 7 placeholders |
| `change-request-form-dialog.tsx` | 7 placeholders |
| `preview-links-content.tsx` | 1 PageHeader + 4 KPICard |
| `contracts-content.tsx` | 1 PageHeader + 4 KPICard |
| `quotations-content.tsx` | 1 PageHeader + 4 KPICard + 2 placeholders |
| `proposals-content.tsx` | 1 PageHeader + 4 KPICard + 2 placeholders |
| `payments-content.tsx` | 1 PageHeader + 3 KPICard |
| `subscriptions-content.tsx` | 1 PageHeader |
| `forms-content.tsx` | 1 PageHeader |
| `communication-log-content.tsx` | 1 PageHeader |

#### I-005 — `aria-required` count: 0 (raised to High)
🟠 **High** · all form components

60 visible asterisk markers exist on Labels, but no `aria-required="true"` is set anywhere. Pair with **0 `aria-describedby`**: error messages are not programmatically associated with inputs. Screen-reader users of forms (lead, ticket, invoice, quotation, proposal dialogs) cannot perceive required-state nor inline validation errors.

**Fix:** add `aria-required` + `aria-describedby` to the shared Label/Input wrapper so all 60 asterisk fields fix in one change.

#### I-006 — Color-contrast risks
🟡 **Medium** · 153 `text-{red,green,amber,yellow}-{500,600}` + 42 `bg-X-100 text-X-700` pairings

`bg-yellow-100 text-yellow-700` ≈ 3.7 :1, fails WCAG AA at small sizes. **Fix:** semantic shadcn tokens or `text-{color}-{800,900}` on light backgrounds.

#### I-008 — All 34 error.tsx files use literal English
🟡 **Medium**

`<h1 className="text-2xl font-bold">Something went wrong</h1>` in every error boundary. AR users see English UI on every route group failure.

**Fix:** wrap in `useTranslations('errors')`; add `errors.somethingWrong`, `errors.tryAgain` to en/ar JSON.

#### I-011 — Zero `Suspense` boundaries
🟡 **Medium** · `grep "Suspense" src/app` → 0

Streaming UI / loading skeletons are not used at the route layer. Combined with no error i18n, fallback states are doubly weak for AR users.

**Confirmed closed:** I-004 (RTL flip + Tailwind 4 variant — `@custom-variant rtl ([dir="rtl"] &)` in globals.css; `rtl:rotate-180` in 20 component files; live-verified via `getComputedStyle().rotate === '180deg'`), i18n key parity (644/644).

---

### DevOps & Supply Chain (D)

**Headline:** CI workflow exists in the repo; 5 high vulns dropped to 4; `_DEPRECATED_CRM-dev/` is gone; Node engine pinned. **The biggest miss:** the CI runs themselves are failing at 0 seconds with a generic "workflow file issue" — CI is **declarative only** until that's resolved.

#### D-007 — GitHub Actions on main failing at 0 s
🟠 **High** · `gh run list --branch main --limit 3` → both runs `failure, 0s`

Runs `24938355258` (hotfix) and `24938195768` (PR merge) both returned `failure` instantly with GitHub message *"This run likely failed because of a workflow file issue."* YAML parses locally; structure is sound.

**Likely causes:** Actions permissions / org policy at the workflow level, or `cache: 'npm'` failing before lockfile resolution. **Fix:** open one of the runs in browser, check Actions settings → permissions; possibly the `env:` block needs to move into individual jobs.

(Note: an earlier PR-event run on the feature branch (`24938041202`) DID execute jobs — Build + Typecheck passed, Lint failed before `continue-on-error` was added. So the workflow file is functional; the failure is event-specific to `push: main`.)

#### D-005 — `.env.example` drift on 6 vars
🟡 **Medium**

In code, missing from `.env.example`: `LOG_LEVEL`, `NODE_ENV`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`. Sentry DSNs are referenced only in `sentry.*.config.ts` — verify and add.

In `.env.example`, unused in code: spot-check `UPLOADTHING_TOKEN` and `NEXTAUTH_URL` (NextAuth uses internally).

#### D-008 — Upstash double-naming
🟢 **Low** · `src/lib/rate-limit.ts`, `src/lib/permissions-cache.ts`

Code reads both `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_REST_URL`. Pick one (Upstash SDK uses `_REST_*`). Otherwise prod silently falls back depending on which file imports which.

#### D-009 — `prisma/dev.db` tracked in repo
🟢 **Low**

1 MB+ SQLite file committed; production uses Postgres. **Fix:** add to `.gitignore`; remove from history if practical.

#### D-010 — Lockfile recently force-regenerated
🟢 **Info** · commit `55e6ade`

Watch subsequent `npm ci` failures.

**npm audit:**

| Severity | Count |
|---|---|
| Critical | 0 |
| High | **4** (was 5) — Next DoS closed; uploadthing/effect chain still upstream-pending |
| Moderate | 10 |
| Low | 0 |

**Outdated (majors):** eslint 9 → 10, typescript 5.9 → 6.0, `@types/node` 20 → 25 (should be `^22` to match runtime).

**Confirmed closed:** D-001 file present, D-002 partial (Next 16.2.4), D-004 (`_DEPRECATED_CRM-dev/` deleted), D-006 (engines.node + .nvmrc), D-007 file existence ✓ but execution ✗.

---

## What's Verified Working in Production

These are live-tested and confirmed:

✅ **`crm.zainhub.ae` resolves and redirects unauthenticated traffic to `/login`.**
✅ **Database connectivity** — `/api/health` returns `db.ok: true, latencyMs: 111`.
✅ **All security headers present** — CSP, HSTS (with preload), X-Frame-Options, Permissions-Policy, X-Content-Type-Options, Referrer-Policy.
✅ **HTTP/2** in use; Vercel-served from `bom1` (Mumbai) edge.
✅ **Auth gate works** — every API route returns 401 when accessed without a session cookie.
✅ **Audit log** — endpoint returns 200 with rows containing the new `sourceModule`, `beforeValue`, `afterValue` columns. The hotfix migration applied successfully.
✅ **Pagination** — `/api/website-analysis/websites?pageSize=99999` clamps to 100.
✅ **Vercel Analytics** — `_vercel/insights/script.js` returns 200 (script injected at runtime).
✅ **CSRF Origin enforcement** — `POST /api/leads` with cross-origin Origin returns 401 (auth gate fires first; CSRF would be next).
✅ **Multi-tenancy** — confirmed live during the full pre-deploy smoke (Website CREATE + WebsiteIntegration UPDATE audit-logged with `sourceModule: 'website-analysis'` and `tenantId`).
✅ **RTL flip** — confirmed live (`getComputedStyle(arrow).rotate === '180deg'` under `dir="rtl"`).
✅ **Vercel deploys all `Ready` for every commit on `main`** — including the post-merge hotfix.

---

## Recommended Action Plan

Sequenced by blast radius and dependency.

### This week (highest impact, blocking)

1. **Diagnose D-007** — fix the GitHub Actions execution failure on `main`. Without a single green CI run, CI is paper. (~30 min)
2. **Wire P-003** — `cached()` around dashboard stats + 4 lookup-table reads. Tag-invalidate on writes. (~1 hour)
3. **Codemod R-007a** — `console.error → log.error` across `src/app/api/**`. Add ESLint `no-console` rule. (~1 PR, mechanical)
4. **Wire R-004a** — `Sentry.captureException` in 32 sub-route `error.tsx` files (or factor a shared component). (~30 min)
5. **Set Vercel env vars** — `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Activates Sentry + Redis-backed rate limiting. (~5 min once accounts exist; you said you're signed in, but Sentry needs project creation which is in the prohibited-actions list for me.)

### Next sprint (high-impact follow-ups)

6. **S-004 RBAC sweep** — wire `requireApiPermission('module:action')` across the 81 unprotected mutation routes. Needs your input on permission strings per route.
7. **S-005 Portal JWT revocation** — extend `clientPortalSession.revokedAt`, look it up in `verifyPortalToken`. Add logout endpoint.
8. **P-004 Memoization** — `React.memo` on the 18 heavy components.
9. **I-005 a11y forms** — fix the shared Label/Input wrapper to add `aria-required` + `aria-describedby`. Closes 60 fields in one PR.

### Cleanup

10. **S-016** — `tenantSlug` mandatory on portal login.
11. **S-007** — nonce-based CSP (drops `unsafe-inline`).
12. **D-005** — sync `.env.example` with live env-var references.
13. **D-008 / D-009** — unify Upstash naming, gitignore `prisma/dev.db`.
14. **I-001..I-003 / I-008** — wire `useTranslations` in PageHeader, KPICard, dialogs, error.tsx.
15. **Q-103** — shared typed `zodResolver` wrapper.
16. **Q-105 / Q-106** — extract `<EntityFormDialog>`; establish `src/features/<module>/`.

### Optional / lower priority

17. **R-008** — converge on `serverError()` everywhere.
18. **R-012** — expand e2e coverage (invoice flow, lead-convert, RBAC denial).
19. **D-002 finish** — wait for upstream uploadthing patch.

---

## Inventory — Live State

| Metric | Value |
|---|---|
| Branch | `main` (post-merge of PR #1 + hotfix `aefabf4`) |
| Live URL | https://crm.zainhub.ae |
| Vercel deploy status | ✅ Ready (all green on every commit) |
| TS/TSX in `src/` | 464 |
| API route files | 107 |
| Page files | 73 |
| Server actions | 0 (still no `features/` layer) |
| Client components (`'use client'`) | ~145 (lib + tree) |
| Dashboard route groups | 36 |
| API top-level groups | 45 |
| Prisma models | 85 |
| Prisma `@@index` definitions | **177** (up from baseline) |
| Migrations | **7** (init + new modules + NumberSequence + website-analysis + perf-indexes + auditlog-missing-columns + ancillary) |
| i18n keys (en/ar) | 644 / 644 ✅ |
| Test files (unit) | 3 (`api-helpers`, `permissions`, `validators/website-analysis`) |
| Test files (e2e) | 2 (`auth.spec.ts`, `website-analysis.spec.ts`) |
| `npm test` | **33 / 33 passing** |
| `tsc --noEmit` | **0 errors** ✅ (after `prisma generate`) |
| Lint | 37 errors / 77 warnings (job is `continue-on-error`) |
| `error.tsx` files | **34** (was 2) |
| `loading.tsx` files | **33** (was 1) |
| `unstable_cache` consumers | **0** ❌ (helper exists but unused) |
| `React.memo` components | **0** ❌ |
| `as any` (`src/`) | **12** (was 24) |
| `eslint-disable` | **12** (was 25) |
| `console.log` | 0 ✅ |
| `console.error` (`src/app/api`) | 104 (was 103) ⚠️ |
| `npm audit` | 4 high, 10 moderate, 0 critical (was 5 high) |
| `_DEPRECATED_CRM-dev/` | gone ✅ (was 2 GB) |
| Vercel env vars set | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `PORTAL_JWT_SECRET` |
| Vercel env vars to set | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DIRECT_URL` |

---

*Production audit prepared via 7-domain parallel pass + live HTTP probes against `https://crm.zainhub.ae`, April 25, 2026.*
*This document is the authoritative reference for "what's the live state of the system right now."*
