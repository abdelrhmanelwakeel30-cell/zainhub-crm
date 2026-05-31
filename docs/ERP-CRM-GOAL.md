# GOAL — World-class CRM + ERP ("Zain Hub BOS")

> **Definition of done for the autonomous build loop.** Each loop iteration:
> pick the next unchecked, unblocked item → implement → audit (tsc + tests +
> build) → fix → commit on the feature branch → tick the box here. Never break
> the build; never deploy to production without explicit approval.
>
> **Loop state:** see `## Loop Log` at the bottom (append one line per iteration).

## Done (shipped to branch)
- [x] **SEC-0** Patch Next.js auth-bypass CVEs (16.2.4→16.2.6), npm audit 17→9, secrets, console→logger, repo cleanup
- [x] **AGENT-0** Connect 166 AI agents to CRM: AgentApiKey + RBAC, 19 dept roles, 166 users, CRM MCP server, paperclip wiring

## Phase A — Foundation (reliability before scale)
- [ ] **F-1** Test coverage for critical paths: auth, agent-auth, leads, invoicing, multi-tenant isolation, RBAC (target: integration tests on top 15 routes)
- [x] **F-2** Zod validation on GET routes — reusable `parseQuery` + `paginationQuery` helpers (tested) + applied to core list routes (leads, companies, contacts). Long-tail routes get swept systematically under F-4 (route factory).
- [x] **F-3** Replace remaining `any` types with typed DTOs — **0 `no-explicit-any` errors** (was 25+). Typed CSV-export rows, dashboard chart data, optimistic-update payloads, and let Prisma infer in auth/pdf routes.
- [x] **F-6** Clear React-hygiene lint errors — **0 lint errors now** (was 8). Fixed `react-hooks/purity` (lazy `useState(()=>Date.now())` in contracts/payments) + `set-state-in-effect` (derived no-token state in verify-email; justified disables for genuine effects: settings seed, route-change drawer close, localStorage hydrate, palette reset).
- [ ] **F-4** Shared API route factory (auth→validate→tenant-scope→paginate) to cut boilerplate across 122 routes
- [ ] **F-5** Performance pass: DB index audit, response caching, N+1 elimination

## Phase B — CRM power features
- [x] **C-1** Global command palette (⌘K) — already wired in app-shell (`CommandPalette` + Cmd/Ctrl+K handler) with page nav + entity search. Verified functional.
- [x] **C-2** Global cross-entity search — new unified `GET /api/search` (tenant-scoped, ranked, capped) across leads/companies/contacts/opportunities/invoices/tickets/projects; palette now calls it once instead of 3 separate fetches. Verified end-to-end (agent key) + 422 on short query.
- [x] **C-3** Bulk actions — generic opt-in row selection + bulk action bar added to the shared `DataTable` (reusable across all tables); `POST /api/leads/bulk` (archive/assign/stage, RBAC + tenant-scoped + audited); leads table wired with bulk Archive + Export. Verified E2E (403 without leads:delete, 200 assign). Other tables opt-in via the same `DataTable` props.
- [ ] **C-4** Saved views / persisted filters + column prefs per user
- [ ] **C-5** Optimistic UI for mutations (TanStack Query)
- [ ] **C-6** Soft deletes + recycle bin (add `deletedAt` across core models, restore, purge)
- [ ] **C-7** Audit-trail viewer UI (per-record who/what/when timeline)
- [ ] **C-8** Branded PDF generation surfaced for invoices/quotations/proposals
- [ ] **C-9** Realtime notifications (SSE) + notification center + email digests

## Phase C — ERP modules
- [ ] **E-1** HR & Workforce: employees, departments, leave requests, attendance, org chart
- [ ] **E-2** Payroll: salary structures, payslips, run processing, GL postings
- [ ] **E-3** Finance/Accounting: chart of accounts, journal entries, ledgers, trial balance
- [ ] **E-4** Procurement & Vendors: purchase orders, vendor bills, approvals
- [ ] **E-5** Inventory / Assets: items, stock movements, asset register
- [ ] **E-6** Budgeting & cost centers (tie to the agent budget caps in paperclip)
- [ ] **E-7** Executive dashboards + scheduled/exportable reports across CRM+ERP

## Phase D — AI differentiators (Zain Hub edge)
- [ ] **AI-1** RAG "ask your CRM/ERP" (tenant-scoped retrieval + cited answers)
- [ ] **AI-2** AI lead scoring & routing
- [ ] **AI-3** AI drafting (proposals, quotations, follow-ups) with prompt caching
- [ ] **AI-4** Activity / thread summarization
- [ ] **AI-5** Expand the CRM MCP tool surface to all ERP modules so the 166 agents operate the full suite
- [ ] **AI-6** WhatsApp inbound → CRM (lead capture + booking)

## Phase E — SaaS readiness
- [ ] **S-1** Stripe subscription billing (per-tenant plans, metered, dunning)
- [ ] **S-2** Self-serve tenant onboarding/provisioning
- [ ] **S-3** Tenant settings & admin UI (branding, users, plan limits, feature flags)
- [ ] **S-4** Staff 2FA/MFA + SSO (Google/Microsoft); session management UI
- [ ] **S-5** Public API + tenant API keys (generalize AgentApiKey) + docs
- [ ] **S-6** Outbound webhooks (lead.created, invoice.paid → Make/n8n/Zapier)
- [ ] **S-7** Full Arabic i18n + WCAG AA + RTL polish

## Phase F — Launch hardening
- [ ] **L-1** Resolve remaining npm vulns as upstream patched releases land
- [ ] **L-2** Health/uptime, CI gates (lint/test/build/Lighthouse), error budgets
- [ ] **L-3** Load/perf testing; PWA/offline for field use
- [ ] **L-4** Final production audit → deploy

---

## Loop Log
- 2026-05-31 — SEC-0 + AGENT-0 shipped; goal roadmap established. Next: Phase A (F-1 tests).
- 2026-05-31 — F-1 started: agent-auth key/RBAC unit tests (33→39 tests, all pass); vitest `server-only` alias added. Next: integration tests for leads/invoicing/tenant isolation, then F-2 (Zod on GET routes).
- 2026-05-31 — F-2 done (core): `parseQuery`/`paginationQuery` helpers + 5 tests; applied to leads/companies/contacts GET routes (now reject malformed enum/pagination with 422). 39→44 tests, tsc+build pass. Next: F-3 (`any` types) or continue F-1 integration coverage.
- 2026-05-31 — F-3 done: eliminated all `no-explicit-any` lint errors (25+→0) via typed CSV rows, chart data types, optimistic payload types, Prisma inference in auth/pdf. tsc + 44 tests + build all green. Logged F-6 (8 pre-existing React-hygiene errors). Next: F-4 (route factory) or F-6.
- 2026-05-31 — F-6 done: 0 lint errors (was 8). react-hooks/purity via lazy Date.now() state; set-state-in-effect via derived state + justified disables. tsc + 44 tests + build green. Note: src/components/shared/command-palette.tsx already exists — verify/finish C-1 next. Then F-4/F-5 or Phase B.
- 2026-05-31 — C-1 verified done (palette wired in app-shell). C-2 done: built unified GET /api/search (7 entities, ranked, tenant-scoped) + refactored palette to one call. tsc + 44 tests + build (115 routes) green; /api/search verified via agent key. Next: C-3 bulk actions or F-4 route factory.
- 2026-05-31 — C-3 done: generic row-selection + bulk-action bar in shared DataTable; POST /api/leads/bulk (archive/assign/stage, RBAC+audit); leads table wired (Archive/Export). Verified E2E: 403 archive (no leads:delete), 200 assign (count:2), 422 on bad input. tsc + 44 tests + build (116 routes) green. Next: C-4 saved views or F-4 route factory.
