import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const stepSchema = z.object({
  stepNumber: z.number().int().min(1),
  approverType: z.enum(['USER', 'ROLE', 'CLIENT']),
  approverId: z.string().optional(),
  approverRoleId: z.string().optional(),
  approverClientUserId: z.string().optional(),
})

const createSchema = z.object({
  workflowId: z.string().optional(),
  entityType: z.enum([
    'QUOTATION', 'CONTRACT', 'EXPENSE', 'CHANGE_REQUEST', 'PROPOSAL',
    'INVOICE', 'PROJECT_MILESTONE', 'PREVIEW', 'SCOPE', 'BUDGET',
  ]),
  entityId: z.string().min(1),
  entityTitle: z.string().optional(),
  requestedById: z.string().optional(),
  dueDate: z.string().optional(),
  steps: z.array(stepSchema).min(1),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const entityType = searchParams.get('entityType') || ''

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status
  if (entityType) where.entityType = entityType

  try {
    const [data, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: { select: { id: true, firstName: true, lastName: true } },
          steps: {
            select: {
              id: true,
              stepNumber: true,
              status: true,
              approverId: true,
              approver: { select: { id: true, firstName: true, lastName: true } },
              decidedAt: true,
            },
            orderBy: { stepNumber: 'asc' },
          },
        },
      }),
      prisma.approvalRequest.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('approvals:create')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId } = session.user
    const d = parsed.data

    const request = await prisma.approvalRequest.create({
      data: {
        tenantId,
        workflowId: d.workflowId || null,
        entityType: d.entityType,
        entityId: d.entityId,
        entityTitle: d.entityTitle || null,
        requestedById: d.requestedById || null,
        currentStep: 1,
        totalSteps: d.steps.length,
        status: 'IN_PROGRESS',
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        steps: {
          create: d.steps.map((s) => ({
            stepNumber: s.stepNumber,
            approverType: s.approverType,
            approverId: s.approverId || null,
            approverRoleId: s.approverRoleId || null,
            approverClientUserId: s.approverClientUserId || null,
            status: s.stepNumber === 1 ? 'PENDING' : 'PENDING',
          })),
        },
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        steps: {
          select: {
            id: true,
            stepNumber: true,
            status: true,
            approverId: true,
            approver: { select: { id: true, firstName: true, lastName: true } },
            decidedAt: true,
          },
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'approval_request',
        entityId: request.id,
        entityName: request.entityTitle || request.entityId,
      },
    })

    return NextResponse.json({ success: true, data: request }, { status: 201 })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
