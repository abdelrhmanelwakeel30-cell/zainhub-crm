# Zain Hub Business Operating System — Architecture Document

## A) System Architecture Overview

### Product Identity
- **Name:** Zain Hub BOS (Business Operating System)
- **Type:** Full-stack agency management + CRM + ERP-lite platform
- **Dual Purpose:** Zain Hub internal operations + future SaaS product (white-label ready)
- **Core Philosophy:** "One platform to run the entire business"

### Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                     │
│  Next.js App Router │ shadcn/ui │ Tailwind │ i18n (AR/EN)│
├──────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                      │
│  Server Actions │ API Routes │ TanStack Query │ Zustand  │
├──────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                   │
│  Services │ Validators │ Permission Guards │ Event Bus   │
├──────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                      │
│  Prisma ORM │ Tenant Middleware │ Audit Interceptor      │
├──────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                   │
│  PostgreSQL │ Redis (future) │ S3/Storage │ Email        │
└──────────────────────────────────────────────────────────┘
```

### Multi-Tenant Strategy
- **Approach:** Shared database, row-level isolation via `tenantId` on every business table
- **Enforcement:** Prisma middleware auto-injects tenantId on all queries
- **Escalation path:** Can evolve to schema-per-tenant or DB-per-tenant if needed

### Tech Stack (Confirmed)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (App Router) | SSR, server actions, file-based routing |
| Language | TypeScript (strict) | Type safety across full stack |
| UI Components | shadcn/ui + Radix | Accessible, composable, themeable |
| Styling | Tailwind CSS 3.4 | Utility-first, RTL support, dark mode |
| Charts | Recharts | Lightweight, composable, good for dashboards |
| Tables | TanStack Table v8 | Sorting, filtering, pagination, export |
| Forms | React Hook Form + Zod | Performance + schema validation |
| Motion | Framer Motion (minimal) | Page transitions, micro-interactions only |
| i18n | next-intl | AR/EN, RTL/LTR, ICU message format |
| Auth | NextAuth.js v5 | Credentials + OAuth, session management |
| ORM | Prisma 5 | Type-safe queries, migrations, seeding |
| Database | PostgreSQL 16 | JSONB, full-text search, pg_trgm, RLS-ready |
| State (server) | TanStack Query v5 | Server state caching, optimistic updates |
| State (client) | Zustand | Sidebar state, filters, UI preferences |
| Icons | Lucide React | Consistent, tree-shakeable |
| PDF | @react-pdf/renderer | Branded proposals, invoices, reports |
| Date | date-fns | Lightweight, locale-aware |
| Theme | next-themes | Dark/light/system |

---

## B) Navigation / Sidebar Structure

### Sidebar Groups

```
┌─────────────────────────────────────────┐
│  [Zain Hub Logo]                        │
│  ─────────────────────                  │
│                                         │
│  MAIN                                   │
│  ├── Dashboard          لوحة التحكم     │
│  ├── Notifications      الإشعارات       │
│  └── Calendar           التقويم         │
│                                         │
│  CRM & SALES                            │
│  ├── Leads              العملاء المحتملون│
│  ├── Opportunities      الفرص           │
│  ├── Companies          الشركات         │
│  ├── Contacts           جهات الاتصال    │
│  └── Clients            العملاء         │
│                                         │
│  DELIVERY                               │
│  ├── Projects           المشاريع        │
│  ├── Tasks              المهام          │
│  ├── Milestones         المراحل         │
│  └── Tickets            التذاكر         │
│                                         │
│  AGENCY                                 │
│  ├── Social Dashboard   لوحة السوشيال   │
│  ├── Content Calendar   تقويم المحتوى   │
│  ├── Campaigns          الحملات         │
│  └── Approvals          الموافقات       │
│                                         │
│  FINANCE                                │
│  ├── Quotations         عروض الأسعار    │
│  ├── Proposals          المقترحات       │
│  ├── Contracts          العقود          │
│  ├── Invoices           الفواتير        │
│  ├── Payments           المدفوعات       │
│  ├── Expenses           المصروفات       │
│  └── VAT / Tax          الضريبة         │
│                                         │
│  REPORTS                                │
│  ├── Analytics          التحليلات       │
│  ├── Reports Center     التقارير        │
│  └── Documents          المستندات       │
│                                         │
│  ADMIN                                  │
│  ├── Users              المستخدمون      │
│  ├── Roles              الأدوار         │
│  ├── Automations        الأتمتة         │
│  ├── Audit Logs         سجل المراجعة    │
│  └── Settings           الإعدادات       │
│                                         │
│  ─────────────────────                  │
│  [User Avatar] [Dark/Light] [AR/EN]     │
└─────────────────────────────────────────┘
```

### Topbar Components (left to right)
1. Breadcrumb navigation
2. Global search (Cmd+K) — searches leads, companies, contacts, invoices, projects, tasks
3. Quick-add button (+) — Lead, Company, Task, Invoice, Ticket
4. Notification bell with unread count
5. Language switcher (EN/AR)
6. Theme toggle (light/dark)
7. User avatar + dropdown (profile, preferences, logout)

---

## C) Entity Relationship Map

### Core Entity Graph

```
                           ┌─────────────┐
                           │   TENANT    │
                           └──────┬──────┘
                                  │ owns everything
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────┴─────┐          ┌─────┴─────┐          ┌─────┴─────┐
    │   USER    │          │  COMPANY  │          │  SERVICE  │
    │ (team)    │          │ (account) │          │ (catalog) │
    └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
          │                      │                      │
          │              ┌───────┼───────┐              │
          │              │       │       │              │
          │        ┌─────┴──┐ ┌──┴───┐ ┌─┴────┐        │
          │        │CONTACT │ │ LEAD │ │CLIENT│        │
          │        └────┬───┘ └──┬───┘ └──┬───┘        │
          │             │        │        │             │
          │             │   converts to   │             │
          │             │        │        │             │
          │        ┌────┴────────┴────────┴───┐        │
          │        │      OPPORTUNITY         │────────┘
          │        └────────────┬──────────────┘
          │                     │
          │            ┌────────┼────────┐
          │            │        │        │
          │     ┌──────┴──┐ ┌──┴───┐ ┌──┴──────┐
          │     │QUOTATION│ │PROPO-│ │CONTRACT │
          │     │         │ │SAL   │ │         │
          │     └────┬────┘ └──┬───┘ └────┬────┘
          │          │         │          │
          │          └─────┬───┘          │
          │                │              │
          │         ┌──────┴──────┐       │
          │         │   INVOICE   │───────┘
          │         └──────┬──────┘
          │                │
          │         ┌──────┴──────┐
          │         │   PAYMENT   │
          │         └─────────────┘
          │
          │         ┌─────────────┐
          ├────────>│   PROJECT   │──── has ──> Milestones, Tasks
          │         └──────┬──────┘
          │                │
          │         ┌──────┴──────┐
          │         │   TICKET    │
          │         └─────────────┘
          │
          │         ┌─────────────┐
          ├────────>│    TASK     │──── linked to ──> any entity
          │         └─────────────┘
          │
          │         ┌─────────────┐
          └────────>│  CAMPAIGN   │──── tracks ──> leads generated
                    └─────────────┘

CROSS-CUTTING ENTITIES (link to any entity via polymorphic relation):
  • Activity    — timeline events across all entities
  • Document    — files attached to any entity
  • Tag         — categorization for any entity
  • Note        — comments on any entity
  • CustomField — extensible fields per entity type
  • AuditLog    — change tracking for any entity
```

### Key Relationships Summary

| From | To | Relationship | Cardinality |
|------|----|-------------|-------------|
| Tenant | * | Owns | 1:N (every entity) |
| Company | Contact | Has employees | N:M (via CompanyContact) |
| Company | Lead | Originates | 1:N |
| Company | Opportunity | Has deals | 1:N |
| Company | Project | Has deliveries | 1:N |
| Company | Invoice | Billed to | 1:N |
| Company | Ticket | Reports issues | 1:N |
| Company | SocialAccount | Has platforms | 1:N |
| Contact | Lead | Linked | 1:1 (after conversion) |
| Contact | Opportunity | Primary contact | 1:N |
| Lead | Opportunity | Converts to | 1:1 |
| Lead | Company | Converts to | 1:1 |
| Opportunity | QuotationItem | Has line items | 1:N |
| Opportunity | Service | Interested in | N:M (via OpportunityService) |
| Quotation | QuotationItem | Contains | 1:N |
| Quotation | Opportunity | Belongs to | N:1 |
| Contract | Invoice | Generates | 1:N |
| Contract | Project | Governs | 1:N |
| Invoice | InvoiceItem | Contains | 1:N |
| Invoice | Payment | Receives | 1:N |
| Project | Task | Has | 1:N |
| Project | Milestone | Has | 1:N |
| Project | ProjectMember | Staffed by | 1:N |
| SocialAccount | ContentItem | Creates | 1:N |
| ContentItem | ContentApproval | Reviewed by | 1:N |
| Campaign | Lead | Generates | 1:N |
| User | Lead | Assigned | 1:N |
| User | Opportunity | Owns | 1:N |
| User | Project | Manages | 1:N |
| User | Task | Assigned | 1:N |
| User | Ticket | Assigned | 1:N |

---

## D) Core Workflows

### Lead-to-Cash Workflow

```
INBOUND                    QUALIFICATION              SALES                      DELIVERY                   FINANCE
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Website Form ─┐
WhatsApp ─────┤            ┌──────────┐               ┌──────────┐              ┌──────────┐              ┌──────────┐
Social DM ────┤──> LEAD ──>│ Qualify   │──> OPPTY ──> │ Quotation│──> WON ──>  │ Project  │──> DONE ──> │ Invoice  │
Referral ─────┤            │ Score     │              │ Proposal │              │ Kickoff  │              │ Payment  │
Ads/Campaign ─┤            │ Assign    │              │ Negotiate│              │ Deliver  │              │ Receipt  │
Manual ───────┤            └──────────┘               └──────────┘              └──────────┘              └──────────┘
CSV Import ───┘                 │                          │                         │                        │
                                │                          │                         │                        │
                           if not qualified            if lost                  if issues                  if overdue
                                │                          │                         │                        │
                                v                          v                         v                        v
                           NURTURE /                  LOST REASON              TICKET /                  REMINDER /
                           NO RESPONSE                ANALYTICS                ESCALATION                ALERT
```

### Conversion Flow (Lead → Company + Contact + Opportunity)

```
1. Lead qualifies
2. System checks: does Company already exist? (by name/domain/email)
   a. Yes → link lead to existing Company
   b. No  → create new Company from lead data
3. System checks: does Contact already exist? (by email)
   a. Yes → link lead to existing Contact
   b. No  → create new Contact from lead data
4. Create Opportunity linked to Company + Contact
5. Mark Lead as WON/CONVERTED
6. Transfer all activities, notes, documents from Lead to Opportunity
7. Log conversion in AuditLog
```

### Proposal-to-Project Flow

```
1. Quotation/Proposal created for Opportunity
2. Internal review → approval (if discount > threshold)
3. Sent to client
4. Client accepts → status = ACCEPTED
5. Auto-generate:
   a. Contract (DRAFT) from proposal terms
   b. Project (NOT_STARTED) from proposal scope
   c. Invoice (DRAFT) from proposal amounts (or milestone-based invoices)
   d. Onboarding checklist for the service type
6. Notify project manager + account manager
```

### Social Media Content Flow

```
1. Content planned in monthly calendar
2. Assigned to copywriter (caption) + designer (creative)
3. Draft created → INTERNAL_REVIEW
4. Internal team reviews → pass/revise
5. Sent to client → CLIENT_REVIEW
6. Client approves/requests revision
7. APPROVED → schedule for publishing
8. PUBLISHED → log engagement metrics
9. Monthly report generated
```

---

## E) Implementation Sequence

### Phase 1: Foundation + Core CRM (Weeks 1-3)

**Priority: CRITICAL — everything depends on this**

| Order | Component | Details |
|-------|-----------|---------|
| 1.1 | Project setup | Next.js, Tailwind, shadcn/ui, Prisma, TypeScript config |
| 1.2 | Prisma schema | All models, enums, relations, indexes |
| 1.3 | Database setup | PostgreSQL, migrations, connection |
| 1.4 | Multi-tenant foundation | Tenant model, middleware, context provider |
| 1.5 | Auth system | NextAuth, login, session, password reset |
| 1.6 | RBAC engine | Roles, permissions, guards, middleware |
| 1.7 | App shell | Layout, sidebar, topbar, breadcrumbs, theme, i18n scaffold |
| 1.8 | Reusable UI kit | DataTable, PageShell, FilterBar, FormSheet, KPICard, StatusBadge, EmptyState, LoadingState |
| 1.9 | Activity system | Polymorphic activity logging service |
| 1.10 | Audit trail | Prisma middleware for change tracking |
| 1.11 | Companies module | List, detail, create/edit, contacts tab, timeline |
| 1.12 | Contacts module | List, detail, create/edit, linked companies, timeline |
| 1.13 | Leads module | List, Kanban, detail, scoring, assignment, conversion |
| 1.14 | Opportunities module | List, Kanban, detail, forecast, stage history |
| 1.15 | Service catalog | Categories, services, packages (admin config) |
| 1.16 | Pipeline config | Configurable stages per entity type |
| 1.17 | Executive dashboard | KPIs, pipeline chart, lead source chart, recent activity |
| 1.18 | Global search | Command palette (Cmd+K) across entities |
| 1.19 | Notification center | In-app notification list + bell icon |
| 1.20 | Seed data | Realistic Zain Hub demo data for all Phase 1 entities |

### Phase 2: Delivery + Finance (Weeks 4-6)

| Order | Component | Details |
|-------|-----------|---------|
| 2.1 | Projects module | List, detail, milestones, team, status, health |
| 2.2 | Tasks module | List, Kanban, calendar, subtasks, linked entities |
| 2.3 | Quotation builder | Line items, services, discounts, tax, PDF export |
| 2.4 | Proposal builder | Extended quotation with scope, timeline, methodology |
| 2.5 | Contract management | Create, track, renewal alerts, linked docs |
| 2.6 | Invoice module | Create, send, partial payment, overdue tracking |
| 2.7 | Payment tracking | Record payments, link to invoices, receipts |
| 2.8 | Expense module | Create, categorize, approve, link to projects |
| 2.9 | Tax/VAT config | Rates, inclusive/exclusive, per-tenant settings |
| 2.10 | Finance dashboard | Revenue, expenses, P&L, receivables aging, cashflow |
| 2.11 | Document center | Upload, categorize, link to entities, preview |
| 2.12 | Time tracking | Per task/project, duration logging |
| 2.13 | Client onboarding | Checklist templates, auto-generate from won deals |
| 2.14 | Branded PDF export | Invoice, quotation, proposal with Zain Hub branding |
| 2.15 | Seed data | Finance + delivery demo data |

### Phase 3: Agency + Support + Advanced (Weeks 7-9)

| Order | Component | Details |
|-------|-----------|---------|
| 3.1 | Social media dashboard | Clients, platforms, content status overview |
| 3.2 | Content calendar | Monthly view, drag-drop, status colors |
| 3.3 | Content items | Create, assign designer/copywriter, approval flow |
| 3.4 | Approval engine | Generic configurable: who approves, conditions, escalation |
| 3.5 | Campaign tracking | Create, link leads, track spend, ROI |
| 3.6 | Ticket module | Create, assign, SLA, comments, resolution |
| 3.7 | Marketing dashboard | Campaign metrics, channel performance, CPL |
| 3.8 | Advanced analytics | Sales cycle, win/loss, source attribution, cohort |
| 3.9 | Automation rules | Event→condition→action engine, configurable per tenant |
| 3.10 | Email templates | Merge fields, reusable across modules |
| 3.11 | Bulk operations | Import/export CSV, bulk status change, bulk assign |
| 3.12 | Saved views / filters | Per user, per module, shareable |
| 3.13 | Seed data | Social media + support demo data |

### Phase 4: Polish + Commercial Readiness (Weeks 10-12)

| Order | Component | Details |
|-------|-----------|---------|
| 4.1 | Custom fields engine | Add fields per entity type per tenant |
| 4.2 | Advanced permissions | Field-level visibility, finance-only access |
| 4.3 | Reports center | Pre-built reports + configurable date/owner filters |
| 4.4 | Export center | Branded PDF reports, Excel exports |
| 4.5 | Client health scoring | Composite score from payment + project + engagement |
| 4.6 | MRR/ARR tracking | Recurring revenue from retainer contracts |
| 4.7 | Commission tracking | Sales rep commissions per deal |
| 4.8 | Duplicate detection | Fuzzy matching on lead/contact/company creation |
| 4.9 | Forecast module | Weighted pipeline, monthly/quarterly projections |
| 4.10 | White-label settings | Per-tenant logo, colors, domain |
| 4.11 | Calendar integration | Shared team calendar with meetings, follow-ups, deadlines |
| 4.12 | Full bilingual polish | Complete AR translation, RTL testing, number/date formats |
| 4.13 | Performance optimization | Query optimization, pagination, caching strategy |
| 4.14 | Security hardening | Rate limiting, input sanitization, CSRF, headers |

---

## F) Folder Structure

```
/Volumes/IMac/Claude/CRM/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    ← Authenticated shell: sidebar + topbar
│   │   ├── page.tsx                      ← Executive Dashboard
│   │   ├── leads/
│   │   │   ├── page.tsx                  ← Lead list + Kanban toggle
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx             ← Lead detail
│   │   │   └── new/
│   │   │       └── page.tsx             ← New lead form
│   │   ├── opportunities/
│   │   │   ├── page.tsx                  ← Opportunity list + board
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── companies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx             ← Company 360° profile
│   │   ├── contacts/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── clients/
│   │   │   └── page.tsx                  ← Filtered view of companies (lifecycle=CUSTOMER)
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── tasks/
│   │   │   └── page.tsx
│   │   ├── social-media/
│   │   │   ├── page.tsx                  ← Social dashboard
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx             ← Content calendar
│   │   │   └── accounts/
│   │   │       └── page.tsx
│   │   ├── campaigns/
│   │   │   └── page.tsx
│   │   ├── finance/
│   │   │   ├── page.tsx                  ← Finance dashboard
│   │   │   ├── quotations/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── proposals/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── contracts/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── payments/
│   │   │   │   └── page.tsx
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx
│   │   │   └── tax/
│   │   │       └── page.tsx
│   │   ├── tickets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       ├── users/
│   │       │   └── page.tsx
│   │       ├── roles/
│   │       │   └── page.tsx
│   │       ├── automations/
│   │       │   └── page.tsx
│   │       ├── audit-logs/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx              ← Pipelines, statuses, tax, branding, services
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── leads/
│       │   └── route.ts
│       ├── companies/
│       │   └── route.ts
│       ├── ... (one per module)
│       ├── search/
│       │   └── route.ts
│       └── webhooks/
│           └── route.ts
├── components/
│   ├── ui/                               ← shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   └── ... (40+ shadcn components)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── sidebar-nav.tsx
│   │   ├── topbar.tsx
│   │   ├── breadcrumbs.tsx
│   │   ├── page-shell.tsx               ← Reusable page wrapper: title, actions, filters
│   │   ├── mobile-nav.tsx
│   │   └── theme-provider.tsx
│   ├── shared/
│   │   ├── data-table.tsx               ← Reusable TanStack table with sort/filter/export
│   │   ├── data-table-toolbar.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── data-table-faceted-filter.tsx
│   │   ├── kanban-board.tsx             ← Reusable Kanban for leads, opps, projects, tasks
│   │   ├── kanban-column.tsx
│   │   ├── kanban-card.tsx
│   │   ├── filter-bar.tsx
│   │   ├── search-command.tsx           ← Cmd+K global search
│   │   ├── status-badge.tsx
│   │   ├── priority-badge.tsx
│   │   ├── avatar-group.tsx
│   │   ├── kpi-card.tsx
│   │   ├── stat-card.tsx
│   │   ├── chart-card.tsx
│   │   ├── timeline.tsx                 ← Activity timeline (reused everywhere)
│   │   ├── notes-panel.tsx
│   │   ├── comments-panel.tsx
│   │   ├── document-uploader.tsx
│   │   ├── quick-add-menu.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── confirm-dialog.tsx
│   │   ├── entity-link.tsx              ← Clickable link to any entity
│   │   └── currency-display.tsx
│   ├── forms/
│   │   ├── lead-form.tsx
│   │   ├── company-form.tsx
│   │   ├── contact-form.tsx
│   │   ├── opportunity-form.tsx
│   │   ├── project-form.tsx
│   │   ├── task-form.tsx
│   │   ├── invoice-form.tsx
│   │   ├── expense-form.tsx
│   │   ├── ticket-form.tsx
│   │   └── ... (one per entity)
│   └── charts/
│       ├── pipeline-chart.tsx
│       ├── revenue-chart.tsx
│       ├── leads-by-source.tsx
│       ├── conversion-funnel.tsx
│       ├── monthly-trend.tsx
│       └── ... (reusable chart wrappers)
├── features/                             ← Feature-specific logic (non-UI)
│   ├── dashboard/
│   │   ├── queries.ts                   ← Dashboard data fetching
│   │   └── types.ts
│   ├── leads/
│   │   ├── actions.ts                   ← Server actions (CRUD)
│   │   ├── queries.ts                   ← Data fetching
│   │   ├── validators.ts               ← Zod schemas
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── companies/
│   │   ├── actions.ts
│   │   ├── queries.ts
│   │   ├── validators.ts
│   │   └── types.ts
│   ├── ... (one folder per module)
│   └── shared/
│       ├── activity.ts                  ← Activity logging service
│       ├── audit.ts                     ← Audit log service
│       ├── notification.ts              ← Notification dispatch
│       └── conversion.ts               ← Lead conversion logic
├── lib/
│   ├── auth.ts                          ← NextAuth config
│   ├── auth-guard.ts                    ← requireAuth, requireRole helpers
│   ├── prisma.ts                        ← Prisma client singleton
│   ├── tenant.ts                        ← Tenant context + middleware
│   ├── permissions.ts                   ← Permission matrix + helpers
│   ├── utils.ts                         ← cn(), formatCurrency(), formatDate()
│   ├── constants.ts                     ← App-wide constants
│   └── i18n/
│       ├── config.ts
│       ├── en.json
│       └── ar.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── types/
│   ├── index.ts                         ← Shared TypeScript types
│   ├── next-auth.d.ts                   ← Session type augmentation
│   └── globals.d.ts
├── hooks/
│   ├── use-current-user.ts
│   ├── use-permission.ts
│   ├── use-tenant.ts
│   ├── use-debounce.ts
│   └── use-media-query.ts
├── config/
│   ├── navigation.ts                    ← Sidebar structure config
│   ├── permissions.ts                   ← Module permission definitions
│   └── dashboard.ts                     ← Dashboard widget config
├── public/
│   └── images/
│       ├── zainhub-logo.svg
│       ├── zainhub-logo-dark.svg
│       ├── zainhub-icon.svg
│       └── placeholder-avatar.png
├── docs/
│   └── architecture.md                  ← This file
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## G) Critical Architectural Additions

### Additions I'm Including (Beyond Requirements)

| # | Addition | Module | Rationale |
|---|---------|--------|-----------|
| 1 | **Client Portal (future-ready)** | All | Separate /portal route group; clients view projects, approve content, pay invoices, submit tickets. Architecture now, build in Phase 4. |
| 2 | **Time Tracking** | Projects/Tasks | TimeEntry model linked to Task/Project. Essential for agency profitability analysis. |
| 3 | **Multi-Currency** | Finance | Currency field on every monetary value. Exchange rate table. Display in tenant's default currency. |
| 4 | **Recurring Revenue (MRR)** | Finance | Retainer contracts auto-generate monthly invoices. MRR/ARR calculated from active retainers. |
| 5 | **Client Health Score** | CRM | Composite: payment_health + project_health + engagement_recency + ticket_volume. Auto-calculated. |
| 6 | **Onboarding Checklists** | Projects | Template-based per service type. Auto-created when project starts. |
| 7 | **Generic Approval Engine** | System | ApprovalRule model: entity_type + conditions + approver_roles + escalation. Used by content, proposals, expenses. |
| 8 | **Duplicate Detection** | Leads/Contacts | On create: fuzzy match email, phone, name+company. Show merge dialog. |
| 9 | **Sequence Generator** | System | Auto-increment per tenant: LD-0001, INV-0001, PRJ-0001, etc. Stored in Settings. |
| 10 | **Webhook System** | Integrations | Webhook model: event → URL. Fires on lead.created, invoice.paid, etc. Future integration hook. |
| 11 | **Dashboard Widget System** | Dashboard | Dashboard layout stored per user. Drag-drop arrangement future-ready. |
| 12 | **Data Export Engine** | Reports | Standardized CSV/Excel/PDF export for any table view. Reusable across modules. |

### Design System Tokens

```
Brand Colors:
  --primary:     #0F172A (deep navy — trust, authority)
  --primary-600: #1E40AF (action blue)
  --accent:      #3B82F6 (bright blue — interactive)
  --success:     #10B981 (green — won, completed, paid)
  --warning:     #F59E0B (amber — attention, pending)
  --danger:      #EF4444 (red — overdue, lost, urgent)
  --info:        #6366F1 (indigo — informational)

  Light mode:
    --background: #FFFFFF
    --surface:    #F8FAFC
    --border:     #E2E8F0
    --text:       #0F172A
    --muted:      #64748B

  Dark mode:
    --background: #0B1120
    --surface:    #1E293B
    --border:     #334155
    --text:       #F1F5F9
    --muted:      #94A3B8

Typography:
  --font-sans:  'Inter', system-ui, sans-serif
  --font-ar:    'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif
  --font-mono:  'JetBrains Mono', monospace

Spacing scale: 4px base (Tailwind default)
Border radius: rounded-lg (8px) for cards, rounded-md (6px) for inputs
Shadow: shadow-sm for cards, shadow-lg for modals/dropdowns
```
