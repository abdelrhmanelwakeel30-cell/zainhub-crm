import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { log } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['followup', 'proposal', 'quotation']),
  entityId: z.string().min(1),
})

const REQUIRED: Record<string, string> = { followup: 'leads:view', proposal: 'proposals:view', quotation: 'quotations:view' }

const SYSTEM =
  'You are a senior B2B sales writer for Zain Hub, an AI-native digital agency in the UAE/GCC. ' +
  'Write concise, warm, professional English with light Gulf business etiquette. Output only the message body.'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJson(req, schema)
  if (parsed instanceof NextResponse) return parsed
  const { type, entityId } = parsed.data
  const { tenantId, permissions } = session.user

  const required = REQUIRED[type]
  if (!hasPermission(permissions, required)) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required }, { status: 403 })
  }

  try {
    let context = ''
    let fallback = ''
    if (type === 'followup') {
      const lead = await prisma.lead.findFirst({ where: { id: entityId, tenantId }, select: { fullName: true, companyName: true, interestedService: { select: { name: true } }, budgetRange: true } })
      if (!lead) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      const svc = lead.interestedService?.name
      context = `Lead: ${lead.fullName}${lead.companyName ? ` from ${lead.companyName}` : ''}. Interest: ${svc ?? 'general services'}. Budget: ${lead.budgetRange ?? 'unspecified'}.`
      fallback = `Dear ${lead.fullName},\n\nThank you for your interest in Zain Hub${svc ? ` regarding ${svc}` : ''}. I'd welcome a short call to understand your goals and share how we can help${lead.companyName ? ` ${lead.companyName}` : ''} move forward.\n\nWould this week suit you for a 20-minute conversation?\n\nWarm regards,\nZain Hub Team`
    } else {
      const model = type === 'proposal' ? prisma.proposal : prisma.quotation
      // @ts-expect-error dynamic delegate by type
      const doc = await model.findFirst({ where: { id: entityId, tenantId }, select: { title: true } })
      if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      context = `${type} titled "${doc.title}".`
      fallback = `${type === 'proposal' ? 'Proposal' : 'Quotation'}: ${doc.title}\n\nZain Hub is pleased to present this ${type}. Our team will deliver measurable outcomes with a clear scope, timeline, and transparent pricing. We look forward to partnering with you.`
    }

    const { text, source } = await generateText({
      system: SYSTEM,
      prompt: `Write a ${type} message. Context: ${context}`,
      fallback,
      maxTokens: 800,
    })
    return NextResponse.json({ success: true, data: { draft: text, source } })
  } catch (err) {
    log.error('POST /api/ai/draft', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
