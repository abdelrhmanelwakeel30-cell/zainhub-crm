import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals, assertTenantOwnsAll } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'

const CreateSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  contactId: z.string().optional(),
  type: z.enum(['BUG','FEATURE_REQUEST','QUESTION','SUPPORT','CHANGE_REQUEST','OTHER']).optional().default('SUPPORT'),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional().default('MEDIUM'),
  assignedToId: z.string().optional(),
  slaDueAt: z.string().optional(),
  status: z.enum(['NEW','OPEN','IN_PROGRESS','WAITING_CLIENT','RESOLVED','CLOSED','REOPENED']).optional().default('NEW'),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const assignedToId = searchParams.get('assignedToId') || ''
    const clientId = searchParams.get('clientId') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && { OR: [{ subject: { contains: search, mode: 'insensitive' as const } }, { ticketNumber: { contains: search, mode: 'insensitive' as const } }] }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignedToId && { assignedToId }),
      ...(clientId && { clientId }),
    }

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          client: { select: { id: true, displayName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          project: { select: { id: true, projectNumber: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ])

    return paginatedOk(serializeDecimals(data), total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = session.user.tenantId
    const ticketNumber = await nextNumber(tenantId, 'ticket')

    // T-002: every FK accepted from the body must belong to this tenant.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'company', id: parsed.data.clientId },
      { model: 'project', id: parsed.data.projectId },
      { model: 'contact', id: parsed.data.contactId },
      { model: 'user', id: parsed.data.assignedToId },
    ])

    const { slaDueAt, ...rest } = parsed.data

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber,
        createdById: session.user.id,
        slaDueAt: slaDueAt ? new Date(slaDueAt) : undefined,
        ...rest,
      },
    })

    await prisma.auditLog.create({
      data: { tenantId, userId: session.user.id, action: 'CREATE', entityType: 'Ticket', entityId: ticket.id, entityName: ticket.ticketNumber },
    })

    logCreate(tenantId, 'ticket', ticket.id, ticket.subject, session.user.id)

    return NextResponse.json({ success: true, data: serializeDecimals(ticket) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
