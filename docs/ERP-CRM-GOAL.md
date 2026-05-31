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
- [ ] **F-3** Replace remaining `any` types with typed DTOs (kill the 30+ lint errors)
- [ ] **F-4** Shared API route factory (auth→validate→tenant-scope→paginate) to cut boilerplate across 122 routes
- [ ] **F-5** Performance pass: DB index audit, response caching, N+1 elimination

## Phase B — CRM power features
- [ ] **C-1** Global command palette (⌘K) — wire the installed `cmdk`
- [ ] **C-2** Global cross-entity search (leads/companies/contacts/invoices), tenant-scoped + ranked
- [ ] **C-3** Bulk actions on tables (select → assign/status/delete/export)
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
