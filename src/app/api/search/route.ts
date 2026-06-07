import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { parseQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/**
 * Unified global search (C-2). Tenant-scoped, ranked, capped.
 * Searches leads, companies, contacts, opportunities, invoices, tickets and
 * projects in one call and returns a flat, ranked result list ready for the
 * command palette (⌘K) to render.
 */

const searchQuery = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
})

interface SearchResult {
  id: string
  type: 'lead' | 'company' | 'contact' | 'opportunity' | 'invoice' | 'ticket' | 'project'
  title: string
  subtitle: string
  href: string
}

const ci = (q: string) => ({ contains: q, mode: 'insensitive' as const })

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = parseQuery(new URL(req.url).searchParams, searchQuery)
  if (parsed instanceof NextResponse) return parsed
  const { q, limit } = parsed.data
  const tenantId = session.user.tenantId

  try {
    const [leads, companies, contacts, opportunities, invoices, tickets, projects] = await Promise.all([
      prisma.lead.findMany({
        where: { tenantId, archivedAt: null, OR: [{ fullName: ci(q) }, { email: ci(q) }, { companyName: ci(q) }] },
        select: { id: true, fullName: true, leadNumber: true, companyName: true },
        take: limit,
      }),
      prisma.company.findMany({
        where: { tenantId, archivedAt: null, OR: [{ displayName: ci(q) }, { legalName: ci(q) }, { email: ci(q) }] },
        select: { id: true, displayName: true, companyNumber: true, industry: true },
        take: limit,
      }),
      prisma.contact.findMany({
        where: { tenantId, archivedAt: null, OR: [{ firstName: ci(q) }, { lastName: ci(q) }, { email: ci(q) }] },
        select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
        take: limit,
      }),
      prisma.opportunity.findMany({
        where: { tenantId, OR: [{ title: ci(q) }, { opportunityNumber: ci(q) }] },
        select: { id: true, title: true, opportunityNumber: true },
        take: limit,
      }),
      prisma.invoice.findMany({
        where: { tenantId, invoiceNumber: ci(q) },
        select: { id: true, invoiceNumber: true, status: true },
        take: limit,
      }),
      prisma.ticket.findMany({
        where: { tenantId, OR: [{ subject: ci(q) }, { ticketNumber: ci(q) }] },
        select: { id: true, subject: true, ticketNumber: true, status: true },
        take: limit,
      }),
      prisma.project.findMany({
        where: { tenantId, OR: [{ name: ci(q) }, { projectNumber: ci(q) }] },
        select: { id: true, name: true, projectNumber: true },
        take: limit,
      }),
    ])

    const results: SearchResult[] = [
      ...leads.map((l): SearchResult => ({ id: l.id, type: 'lead', title: l.fullName, subtitle: `${l.leadNumber} · ${l.companyName ?? ''}`.trim(), href: `/leads/${l.id}` })),
      ...companies.map((c): SearchResult => ({ id: c.id, type: 'company', title: c.displayName, subtitle: `${c.companyNumber} · ${c.industry ?? ''}`.trim(), href: `/companies/${c.id}` })),
      ...contacts.map((c): SearchResult => ({ id: c.id, type: 'contact', title: `${c.firstName} ${c.lastName}`.trim(), subtitle: `${c.email ?? ''} · ${c.jobTitle ?? ''}`.trim(), href: `/contacts/${c.id}` })),
      ...opportunities.map((o): SearchResult => ({ id: o.id, type: 'opportunity', title: o.title, subtitle: o.opportunityNumber, href: `/opportunities/${o.id}` })),
      ...invoices.map((i): SearchResult => ({ id: i.id, type: 'invoice', title: i.invoiceNumber, subtitle: String(i.status), href: `/invoices/${i.id}` })),
      ...tickets.map((t): SearchResult => ({ id: t.id, type: 'ticket', title: t.subject, subtitle: `${t.ticketNumber} · ${String(t.status)}`, href: `/tickets/${t.id}` })),
      ...projects.map((p): SearchResult => ({ id: p.id, type: 'project', title: p.name, subtitle: p.projectNumber, href: `/projects/${p.id}` })),
    ]

    // Rank: title that starts with the query first, then contains.
    const lq = q.toLowerCase()
    results.sort((a, b) => {
      const as = a.title.toLowerCase().startsWith(lq) ? 0 : 1
      const bs = b.title.toLowerCase().startsWith(lq) ? 0 : 1
      return as - bs
    })

    return NextResponse.json({ success: true, data: results })
  } catch (err) {
    log.error('GET /api/search', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
