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
- [x] **AGENT-DASH** In-CRM Agents dashboard at `/admin/agents` (+ sidebar nav, EN/AR) — `GET /api/agents` fleet API (status active/idle/never/revoked from API-key lastUsedAt, per-department breakdown, summary). Animated UI via framer-motion: count-up KPIs, staggered agent cards, pulsing "active" status dots, animated department bars. Verified E2E (RBAC 403 for sales, 200 fleet of 166/19-depts for leadership) + build.

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
- [x] **C-4** Saved views / persisted filters — `SavedFilter`-backed API (`/api/saved-views` GET/POST + `[id]` PATCH/DELETE, tenant+user+module scoped, own+shared, single-default), reusable `<SavedViews>` dropdown (apply/save/delete), wired into the leads view with an urgency quick-filter. Verified E2E (create-default/list/delete/422). Keyboard ⌘K already via C-1; per-column show/hide prefs is a minor follow-up.
- [x] **C-5** Optimistic UI for mutations — notifications mark-read / mark-all-read now flip instantly with onMutate snapshot + onError rollback + onSettled re-sync (joins the existing optimistic opportunities-kanban DnD). Reusable cache-patch pattern established.
- [x] **C-6** Soft deletes + recycle bin — standardized on existing `archivedAt`; added bulk `restore` action to `/api/leads/bulk` (targets archived rows) + `?archived=true` listing + a "Recycle bin" toggle in the leads view with a Restore bulk action. Verified E2E (archive→listed→restore→gone). Pattern reusable for other entities.
- [x] **C-7** Audit-trail viewer — global admin log already existed; added per-record `GET /api/audit-trail` (tenant-scoped, entityType+entityId) + reusable `<AuditTimeline>` component, wired into the lead detail sidebar. Verified E2E (2 entries CREATE/ASSIGN, 422 on missing param).
- [x] **C-8** Branded PDF generation — already wired: `/api/pdf/[type]/[id]` (react-pdf) handles invoice/quotation/proposal/contract; all three detail pages have "Download PDF" buttons. Verified the route returns a valid PDF (HTTP 200, application/pdf, 1-page doc).
- [x] **C-9** Realtime notifications (SSE) — `GET /api/notifications/stream` (Node runtime, server-side poll pushes unread count on change, heartbeat + 4-min cap with EventSource auto-reconnect) + `useNotificationStream` hook mounted in app-shell (invalidates ['notifications'] live). Verified E2E (401 no-auth; streams ready + notifications events with agent key).

## Phase C — ERP modules
- [x] **E-1** HR & Workforce — `Employee` + `LeaveRequest` models + migration; manager hierarchy (org chart via managerId); `employees`/`leave` perms in both seeds + HR role; full APIs (employees CRUD+archive, leave create + approve/reject/cancel) RBAC+audit; **UI** at `/admin/hr` (employees DataTable + leave tab with approve/reject + New-employee dialog) + sidebar nav (EN/AR). Verified E2E (sales 403; HR creates EMP-0001, files+approves leave) + build. (Attendance/payslip-linkage are future add-ons.)
- [x] **E-2** Payroll — `PayrollRun` + `Payslip` models + migration; `payroll` perm in both seeds + Finance role; APIs (runs GET/POST, `[id]` process→generates payslips / mark-paid state-guarded, payslips GET) RBAC+audit; **UI** at `/admin/payroll` (runs list, New-run dialog, Process / Mark-paid buttons, payslips dialog) + sidebar nav (EN/AR). Verified E2E (sales 403; finance PRN-0001 → process 1 payslip gross 15000 → mark-paid) + build. (GL posting hook lands with E-3 accounting.)
- [x] **E-3** Finance/Accounting — `Account` (AccountType enum) + `JournalEntry` + `JournalLine` models + migration; `accounting` perm in both seeds + Finance role; APIs (accounts GET/POST unique-code, journal entries GET/POST with **double-entry balanced validation**, `[id]` post→accounting:approve); **UI** at `/admin/accounting` (Chart-of-Accounts tab + New-account dialog; Journal-Entries tab + multi-line New-entry dialog with **live debit/credit balance indicator** + Post button) + sidebar nav (EN/AR). Verified E2E (sales 403; balanced JE-0001 201 / unbalanced 422) + build. (Ledgers/trial-balance + auto GL postings are future add-ons.)
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
- 2026-05-31 — C-4 done: SavedFilter-backed /api/saved-views (GET/POST + [id] PATCH/DELETE), reusable <SavedViews> dropdown, leads urgency quick-filter wired. Verified E2E (create-default/list/delete/422-missing-module). tsc + 44 tests + build (117 routes) green. Next: C-5 optimistic UI or F-4 route factory.
- 2026-05-31 — C-5 done: optimistic notifications mark-read/mark-all (onMutate snapshot + rollback + onSettled invalidate); joins existing optimistic opportunities-kanban. tsc + 44 tests + build green. Next: C-6 soft deletes + recycle bin, or F-4 route factory.
- 2026-05-31 — C-7 done: per-record GET /api/audit-trail + reusable <AuditTimeline> wired into lead detail (global admin audit viewer already existed). Verified E2E (2 entries, 422 on missing param). tsc + 44 tests + build (118 routes) green. Next: C-6 soft deletes, C-8 PDF, or F-4 route factory.
- 2026-05-31 — C-8 verified done (PDF route + download buttons already wired; route returns valid application/pdf). C-6 done: archivedAt soft-delete standardized + bulk restore + ?archived listing + leads recycle-bin toggle. Verified E2E (archive→list→restore→gone). tsc + 44 tests + build (118 routes) green. Phase B complete except C-9 (realtime). Next: C-9 or F-4 route factory / F-5 perf, then Phase C (ERP).
- 2026-05-31 — AGENT-DASH done (goal directive): in-CRM Agents dashboard /admin/agents + /api/agents fleet API + sidebar nav (EN/AR). framer-motion animations (count-up KPIs, staggered cards, pulsing active dots, animated dept bars). Verified E2E (403 sales / 200 leadership, 166 agents/19 depts) + build (120 routes). tsc + 44 tests green.
- 2026-05-31 — C-9 done: SSE /api/notifications/stream + useNotificationStream hook in app-shell (live unread updates). Verified E2E (401 no-auth, streams ready+notifications events). tsc + 44 tests + build (120 routes) green. **Phase B fully complete.** Next: F-4 route factory / F-5 perf, then Phase C ERP (E-1 HR).
- 2026-05-31 — Phase C started. E-1 HR backend: Employee + LeaveRequest models + curated migration (122 routes); employees/leave permissions in both seeds + HR role; full CRUD/approve APIs with RBAC+audit. Verified E2E (sales 403; HR creates EMP-0001 + files/approves leave). tsc + 44 tests + build green. Next: E-1 HR UI (list page + nav + attendance), then E-2 payroll.
- 2026-05-31 — E-1 DONE: HR UI at /admin/hr (employees DataTable + leave approve/reject tab + New-employee dialog) + sidebar nav (EN/AR). tsc + 44 tests + build (123 routes) green. Next: E-2 Payroll (SalaryStructure/Payslip + run processing).
- 2026-05-31 — E-2 backend done: PayrollRun + Payslip models + migration (125 routes); payroll perm in both seeds + Finance role; runs CRUD + process (payslip generation) + mark-paid + payslips list, RBAC+audit. Verified E2E (sales 403; finance PRN-0001 → process 1 payslip gross 15000 → mark-paid PAID). tsc + 44 tests + build green. Next: payroll UI tab, then E-3 Accounting.
- 2026-05-31 — E-2 DONE: payroll UI at /admin/payroll (runs list, New-run dialog, Process/Mark-paid, payslips dialog) + sidebar nav (EN/AR). tsc + 44 tests + build (126 routes) green. Next: E-3 Accounting (chart of accounts + balanced journal entries).
- 2026-05-31 — Goal re-verified: agents dashboard visually confirmed via Playwright login + screenshot (166 agent cards, animated KPIs/bars rendering live at /admin/agents). E-3 Accounting backend: Account + JournalEntry + JournalLine models + migration (128 routes); accounting perm in both seeds + Finance role; accounts + balanced-JE APIs (debits==credits validation) + post. Verified E2E (sales 403; balanced JE-0001 201 / unbalanced 422). tsc + 44 tests + build green. NOTE: restart dev after `prisma generate` (running server caches old client). Next: accounting UI, then E-4 procurement.
- 2026-05-31 — E-3 DONE: accounting UI at /admin/accounting (chart of accounts tab + new-account dialog; journal entries tab + multi-line balanced new-entry dialog with live debit/credit indicator + Post) + sidebar nav (EN/AR). tsc + 44 tests + build (129 routes) green. Next: E-4 Procurement (purchase orders + vendors), then E-5 Inventory.
