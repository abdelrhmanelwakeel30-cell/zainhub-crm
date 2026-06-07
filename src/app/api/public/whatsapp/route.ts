import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { log } from '@/lib/logger'

/**
 * WhatsApp inbound webhook (AI-6). Public (no session) — this is /api/public/*.
 * GET: Meta verification handshake. POST: parse an inbound message → create a
 * lead in the configured tenant. Tolerant of Meta's nested webhook shape and a
 * simple {from,text} test shape.
 */

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const mode = sp.get('hub.mode')
  const token = sp.get('hub.verify_token')
  const challenge = sp.get('hub.challenge')
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200, headers: { 'content-type': 'text/plain' } })
  }
  return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 403 })
}

interface Parsed { from: string; text: string; name?: string }

function parseInbound(body: unknown): Parsed | null {
  const b = body as Record<string, unknown>
  // Simple test shape: { from, text, name? }
  if (typeof b?.from === 'string' && typeof b?.text === 'string') {
    return { from: b.from, text: b.text, name: typeof b.name === 'string' ? b.name : undefined }
  }
  // Meta shape: entry[].changes[].value.{messages[],contacts[]}
  try {
    const entry = (b?.entry as Array<Record<string, unknown>>)?.[0]
    const change = (entry?.changes as Array<Record<string, unknown>>)?.[0]
    const value = change?.value as Record<string, unknown>
    const msg = (value?.messages as Array<Record<string, unknown>>)?.[0]
    if (!msg) return null
    const from = String(msg.from ?? '')
    const text = String((msg.text as Record<string, unknown>)?.body ?? '')
    const contact = (value?.contacts as Array<Record<string, unknown>>)?.[0]
    const name = (contact?.profile as Record<string, unknown>)?.name as string | undefined
    if (!from) return null
    return { from, text, name }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = parseInbound(body)
    // Always 200 to webhooks even when there's nothing to do (avoids retries).
    if (!parsed) return NextResponse.json({ success: true, ignored: true })

    const slug = process.env.WHATSAPP_DEFAULT_TENANT_SLUG || 'zainhub'
    const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (!tenant) {
      log.warn('[whatsapp] no tenant for slug', { slug })
      return NextResponse.json({ success: true, ignored: true })
    }

    const leadNumber = await nextNumber(tenant.id, 'lead')
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        leadNumber,
        fullName: parsed.name || `WhatsApp ${parsed.from}`,
        phone: parsed.from,
        whatsapp: parsed.from,
        notesSummary: parsed.text?.slice(0, 500) || null,
        urgency: 'MEDIUM',
      },
    })
    await prisma.auditLog.create({
      data: { tenantId: tenant.id, action: 'CREATE', entityType: 'lead', entityId: lead.id, entityName: `${lead.fullName} (WhatsApp inbound)` },
    })
    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (err) {
    log.error('POST /api/public/whatsapp', { err })
    // Still 200 so the provider doesn't hammer retries; we've logged it.
    return NextResponse.json({ success: true, ignored: true })
  }
}
