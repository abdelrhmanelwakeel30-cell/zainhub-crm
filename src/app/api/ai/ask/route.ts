import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { log } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({ question: z.string().min(2).max(500) })

interface Citation { type: string; id: string; label: string; href: string }

const SYSTEM =
  'You answer questions about a company\'s CRM/ERP using ONLY the provided context records. ' +
  'Be concise. If the context is insufficient, say so. Reference records by their label.'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJson(req, schema)
  if (parsed instanceof NextResponse) return parsed
  const { question } = parsed.data
  const tenantId = session.user.tenantId
  const q = question.slice(0, 80)
  const ci = { contains: q, mode: 'insensitive' as const }

  try {
    const [leads, companies, contacts, invoices, opps] = await Promise.all([
      prisma.lead.findMany({ where: { tenantId, archivedAt: null, OR: [{ fullName: ci }, { companyName: ci }, { email: ci }] }, select: { id: true, fullName: true, companyName: true, urgency: true }, take: 5 }),
      prisma.company.findMany({ where: { tenantId, archivedAt: null, OR: [{ displayName: ci }, { legalName: ci }] }, select: { id: true, displayName: true, industry: true }, take: 5 }),
      prisma.contact.findMany({ where: { tenantId, archivedAt: null, OR: [{ firstName: ci }, { lastName: ci }, { email: ci }] }, select: { id: true, firstName: true, lastName: true }, take: 5 }),
      prisma.invoice.findMany({ where: { tenantId, invoiceNumber: ci }, select: { id: true, invoiceNumber: true, status: true }, take: 5 }),
      prisma.opportunity.findMany({ where: { tenantId, OR: [{ title: ci }, { opportunityNumber: ci }] }, select: { id: true, title: true }, take: 5 }),
    ])

    const citations: Citation[] = [
      ...leads.map((l): Citation => ({ type: 'lead', id: l.id, label: `Lead: ${l.fullName}${l.companyName ? ` (${l.companyName})` : ''}`, href: `/leads/${l.id}` })),
      ...companies.map((c): Citation => ({ type: 'company', id: c.id, label: `Company: ${c.displayName}`, href: `/companies/${c.id}` })),
      ...contacts.map((c): Citation => ({ type: 'contact', id: c.id, label: `Contact: ${c.firstName} ${c.lastName}`, href: `/contacts/${c.id}` })),
      ...invoices.map((i): Citation => ({ type: 'invoice', id: i.id, label: `Invoice ${i.invoiceNumber} (${i.status})`, href: `/invoices/${i.id}` })),
      ...opps.map((o): Citation => ({ type: 'opportunity', id: o.id, label: `Opportunity: ${o.title}`, href: `/opportunities/${o.id}` })),
    ]

    const context = citations.length ? citations.map((c) => `- ${c.label}`).join('\n') : '(no matching records)'
    const fallback = citations.length
      ? `Here's what I found for "${question}":\n${context}`
      : `I couldn't find records matching "${question}".`

    const { text, source } = await generateText({
      system: SYSTEM,
      prompt: `Question: ${question}\n\nContext records:\n${context}`,
      fallback,
      maxTokens: 600,
    })
    return NextResponse.json({ success: true, data: { answer: text, source, citations } })
  } catch (err) {
    log.error('POST /api/ai/ask', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
