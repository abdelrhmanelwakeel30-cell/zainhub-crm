import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { assertTenantOwnsAll } from '@/lib/api-helpers'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE', 'SMS']),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  subject: z.string().optional(),
  body: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  projectId: z.string().optional(),
  durationSeconds: z.number().optional(),
  loggedAt: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId') || ''
  const type = searchParams.get('type') || ''
  const direction = searchParams.get('direction') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (companyId) where.companyId = companyId
  if (type) where.type = type
  if (direction) where.direction = direction
  if (dateFrom || dateTo) {
    const loggedAt: Record<string, Date> = {}
    if (dateFrom) loggedAt.gte = new Date(dateFrom)
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      loggedAt.lte = end
    }
    where.loggedAt = loggedAt
  }
  try {
    const data = await prisma.communicationLog.findMany({
      where,
      orderBy: { loggedAt: 'desc' },
      include: {
        company: { select: { id: true, displayName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, fullName: true } },
        loggedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 100, // P-001 defensive cap
    })
    return NextResponse.json({ success: true, data })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('comms:create')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const { tenantId, id: userId } = session.user

    // T-002: every FK accepted from the body must belong to this tenant.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'company', id: parsed.data.companyId },
      { model: 'contact', id: parsed.data.contactId },
      { model: 'lead', id: parsed.data.leadId },
      { model: 'opportunity', id: parsed.data.opportunityId },
      { model: 'project', id: parsed.data.projectId },
    ])

    const log = await prisma.communicationLog.create({
      data: {
        tenantId,
        type: parsed.data.type as 'NOTE',
        direction: parsed.data.direction as 'OUTBOUND',
        subject: parsed.data.subject || null,
        body: parsed.data.body || null,
        companyId: parsed.data.companyId || null,
        contactId: parsed.data.contactId || null,
        leadId: parsed.data.leadId || null,
        opportunityId: parsed.data.opportunityId || null,
        projectId: parsed.data.projectId || null,
        durationSeconds: parsed.data.durationSeconds || null,
        loggedById: userId,
        loggedAt: parsed.data.loggedAt ? new Date(parsed.data.loggedAt) : new Date(),
      },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'communicationLog', entityId: log.id, entityName: log.subject || log.type } })
    return NextResponse.json({ success: true, data: log }, { status: 201 })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
