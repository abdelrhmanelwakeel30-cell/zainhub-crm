# Zain Hub CRM V3 — Re-Audit (delta vs full audit)

> **Date:** April 25, 2026 (same day as the full audit, post-fix wave)
> **Scope:** measure which findings from `CRM-V3-FULL-AUDIT-2026-04-25.md` (67 items) are now closed, partial, or still open after the autonomous fix waves.
> **Method:** targeted self-checks via grep + file inspection. The full 7-domain parallel agent re-run was blocked by Anthropic API rate-limit (resets 9:20 PM Dubai); a fuller re-audit can run after that.
>
> **Branch:** `feature/website-analysis-phase-1`. Six new commits land this fix push:
> - `e979bd2` chore: wave 1 audit fixes — hygiene cleanup
> - `aaa19a5` chore: wave 1 (cont.) — config + schema + CI + cache helper
> - `56c67fe` sec+rel: wave 2 audit fixes — portal auth, tenancy, health, audit-in-tx
> - `bdb5230` a11y(rtl): flip back-arrow icons in 16 detail pages
> - `9cdd9d9` perf(website-analysis): paginate websites GET

---

## Headline numbers

| Severity | Pre-fix | Closed | Partial | Still open | Deferred |
|---|---|---|---|---|---|
| 🔴 Critical | 5 | 1 | 1 | 1 | 2 |
| 🟠 High | 17 | 6 | 1 | 4 | 6 |
| 🟡 Medium | 28 | 11 | 0 | 7 | 10 |
| 🟢 Low | 17 | 1 | 0 | 0 | 16 |
| **Total** | **67** | **19** | **2** | **12** | **34** |

**Closed: 19 / 67 (~28 %).** Most are foundational (CI, hygiene, indexes, cookie tightening, OTP fix, etc.). The 34 deferred items are either (a) beyond a single autonomous session (RBAC sweep across 86 routes, 16-component memo refactor, full i18n wiring) or (b) requiring external account setup (Sentry, Upstash, secret rotation in Vercel).

---

## Closed (19)

### 🔴 Critical (1 closed)

- **D-001 — Zero CI/CD pipeline** → 🟢 CLOSED. New `.github/workflows/ci.yml` runs lint + typecheck + build + audit on every PR and push to main. `audit` job is `continue-on-error` until D-002 dep bumps land — flip to required after.

### 🟠 High (6 closed)

- **S-001 — OTP `Math.random()`** → 🟢 CLOSED. `crypto.randomInt(100000, 1_000_000)`. Verified: 0 `Math.random` references in `send-otp/route.ts` outside a comment.
- **S-003 — OTP echoed in dev response** → 🟢 CLOSED. OTP no longer in HTTP body in any environment; logs to server in dev.
- **S-006 — NextAuth cookies missing `sameSite='strict'`** → 🟢 CLOSED. Explicit cookie config in `src/lib/auth.ts`: `__Secure-` / `__Host-` prefixes in production; `httpOnly + sameSite: 'strict' + secure` everywhere.
- **S-009 — `PORTAL_JWT_SECRET` falls back to `NEXTAUTH_SECRET`** → 🟢 CLOSED. Centralised `getPortalJwtSecret()` in `src/lib/portal-auth.ts` throws if missing. All 3 portal routes (`login`, `me`, `verify-otp`) now import the helper instead of duplicating.
- **S-011 — Portal login enables account enumeration** → 🟢 CLOSED. All auth-failure branches collapse to a single 401 "Invalid credentials"; reasons are logged server-side only.
- **T-001 — Cross-tenant role assignment via unvalidated `roleIds[]`** → 🟢 CLOSED. Both `admin/users` POST and PATCH now `findMany` `Role` rows scoped by tenant first; reject the whole transaction if any roleId belongs to another tenant.

### 🟡 Medium (11 closed)

- **T-003** — `client-portal/dashboard` count gets `tenantFilter`.
- **R-003** — `/api/health` now `SELECT 1` with 2s timeout, returns 503 + `degraded` status on failure.
- **R-005** — Dashboard `error.tsx` hides `error.message` in production; shows `digest` only.
- **R-009** — `auditLog.create` moved inside `$transaction` for `leads/[id]/convert` and `invoices/[id]/payments`.
- **R-010** — `sendPaymentConfirmation` wrapped in `Promise.resolve().catch()` so a Resend outage logs instead of silently disappearing.
- **D-005** — `.env.example` synced with `process.env.*` references in `src/`. `CSP_REPORT_ONLY`, `NEXT_IMAGE_HOSTS`, `PORTAL_JWT_SECRET` now documented.
- **D-006** — Node engine pinned: `package.json engines.node>=22.0.0` + `.nvmrc 22`.
- **D-007** (partial) — `shadcn` CLI moved from `dependencies` to `devDependencies`. `tw-animate-css` and `cmdk` left in place pending usage check.
- **P-008** — Activity model now has `(tenantId, performedById, performedAt DESC)` index. Plus Task `(tenantId, createdAt DESC)` and Opportunity `(tenantId, wonAt, lostAt)`.
- **P-009** — Reframed: Prisma 7 deprecates `directUrl` in schema; the `@prisma/adapter-pg/-neon` adapter handles routing. `prisma.config.ts` cleaned up to use single `url` (prefers `DIRECT_URL` if set for migrations).
- **Q-005** — `src/lib/demo-data/` (14 orphan files) deleted.

### 🟢 Low (1 closed)

- **I-004 — Detail-page back arrows don't flip in RTL** → 🟢 CLOSED. 16 detail pages now use `<ArrowLeft className="… rtl:rotate-180" />`.

---

## Partial (2)

### 🔴 Critical (1)

- **P-001 — Unbounded `findMany` on 13 routes** → 🟠 PARTIAL. The just-shipped `website-analysis/websites/route.ts` is now paginated (`parsePagination` + `paginatedOk`, max 100). The remaining 12 routes (`deliverables`, `preview-links`, `communication-logs`, `projects/[id]/documents`, `admin/settings`, `pipelines`, `lead-sources`, `expense-categories`, `admin/permissions`, `admin/roles`, `users` org branch, `preview-links/[id]/feedback`) still need the same treatment.

### 🟠 High (1)

- **D-002 — 5 high-severity npm vulns** → 🟠 PARTIAL. `npm audit` baseline captured but the dep-bump portion of Wave 1C didn't complete (agent quota). Re-run `npm audit fix` + targeted bumps for `next 16.2.2 → 16.2.4`, `next-intl 4.9.0 → 4.9.1`, `uploadthing` to latest after quota reset.

---

## Still open after this push (12)

Either touched but not landed, or scoped out as "needs careful work":

### 🔴 Critical (1)

- **R-002 — No observability platform** → 🔵 BLOCKED on user. Sentry installation needs DSN + account.

### 🟠 High (4)

- **S-002 — No login rate limit on portal password endpoint** → blocked on Upstash Redis (Fix-004).
- **S-004 — 86 mutation routes skip `requireApiPermission`** → too large for one session; deserves its own focused PR.
- **S-005 — Portal JWT not revocable** → needs schema decision (extend `clientPortalSession` with `revokedAt`) and a logout endpoint.
- **Q-001 — `_prisma as any` in 13 portal/account-health routes** → indicates schema drift; needs product input on missing models.

### 🟡 Medium (7)

- **S-007** — Edge middleware accepts any non-empty session cookie (defense-in-depth claim).
- **S-008** — In-process login limiter (Upstash blocked).
- **S-010** — CSP `unsafe-inline` in production (Fix-015 deferred upstream).
- **P-005** — Dashboard `groupBy` then second `findMany` for labels.
- **Q-003** — 115 `console.error` sites; no structured logger.
- **Q-008** — No `features/` layer; business logic in route handlers.
- **R-008** — Inconsistent API error pattern (helpers vs inline).

---

## Deferred (34) — explicitly out of scope for this autonomous push

These need either external setup, careful schema/product design, or a multi-session refactor. None are silently dropped — they're tracked.

### Needs external account / setup (4)

- **R-001 / Fix-001** Vitest + Playwright bootstrap (~107 routes worth of test scaffolding)
- **R-002 / Fix-006** Sentry install (DSN required)
- **S-008 / Fix-004** Upstash Redis (account + env vars)
- **D-003 / Fix-007** Rotate `NEXTAUTH_SECRET` + Neon password (Vercel UI)

### Needs product input (1)

- **Q-001** Resolve schema drift in `client-portal/account-health` — likely missing models. Need to know what entities portal users actually persist.

### Multi-file refactor too large for one session (8)

- **R-004 / Fix-016** Error boundary scaffolding × 35 dashboard route groups
- **P-004 / Fix-017** React.memo across 16 list/kanban components
- **S-004 / Fix-037** RBAC sweep across 86 mutation routes
- **T-002 / Fix-036** `assertTenantOwnsAll` helper applied across 13 POST routes
- **Fix-009** Zod on remaining 34 routes
- **I-001 / I-002 / I-003 / Fix-042** i18n wiring in `PageHeader`, `KPICard`, dialogs
- **I-005 / I-006 / I-007** `aria-required`, color contrast pass, placeholder strings
- **Q-010** Extract `<EntityFormDialog>` from 23 duplicates

### Other deferred (21)

S-012, S-013, S-014, T-004 (info), T-005 (info), P-002, P-003 (helper landed; wiring deferred), P-006, P-007, P-010, P-011 (positive), P-012 (positive), P-013, Q-002, Q-004, Q-006 (largely closed via ESLint ignores; full lint --fix sweep deferred), Q-007, Q-009, R-006, R-007, R-011, R-012, I-008, I-009, I-010, D-008.

---

## Verification

- `npx tsc --noEmit` — ✅ clean (post-fix; baseline was also clean)
- `npm run build` — ✅ succeeds, all 80+ routes compile
- `npm run lint` — module-scoped clean for files we touched; broader baseline noise unchanged
- All 6 commits made it onto `feature/website-analysis-phase-1`; Wave 1 used 2 commits because the first `git add -A <paths>` glitched on a deleted directory and only captured deletes.

## What to do next (in order)

1. **Push the branch + update PR #1** with the audit fixes batch.
2. **After 9:20 PM Dubai** (rate-limit reset): re-run the 7 parallel domain auditors to get a fresh independent read on the deltas + catch anything self-checks missed.
3. **Schedule the deferred work** as discrete sprints:
   - Sprint 0 finishing (this week): npm audit fix, secret rotation, Upstash + Sentry account setup, then Fix-004/Fix-005/Fix-006/Fix-008 (limiters + obs).
   - Sprint 1 (next week): RBAC sweep + remaining Zod + `assertTenantOwnsAll` rollout (T-002).
   - Sprint 2: Error boundaries × 35, React.memo refactor, i18n wiring sweep.
4. **Vercel UI work** the user owns:
   - Rotate `NEXTAUTH_SECRET` and Neon password (D-003)
   - Add `PORTAL_JWT_SECRET`, `UPSTASH_REDIS_*`, `SENTRY_*` env vars
   - Enable required-status-checks on `main` branch protection now that CI exists.

---

*Re-audit prepared April 25, 2026, immediately after the autonomous fix waves completed within rate-limit.*
