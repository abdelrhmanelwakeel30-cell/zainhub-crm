import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const workflowStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  approverType: z.enum(['USER', 'ROLE', 'CLIENT']),
  approverId: z.string().optional(),
  approverRoleId: z.string().optional(),
  label: z.string().optional(),
})

const createSchema = z.object({
  name: z.string().min(2),
  entityType: z.enum([
    'QUOTATION', 'CONTRACT', 'EXPENSE', 'CHANGE_REQUEST', 'PROPOSAL',
    'INVOICE', 'PROJECT_MILESTONE', 'PREVIEW', 'SCOPE', 'BUDGET',
  ]),
  steps: z.array(workflowStepSchema).min(1),
  isActive: z.boolean().default(true),
})

export async function GET(_req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const workflows = await prisma.approvalWorkflow.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: workflows })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const { tenantId } = session.user
    const d = parsed.data

    const workflow = await prisma.approvalWorkflow.create({
      data: {
        tenantId,
        name: d.name,
        entityType: d.entityType,
        steps: d.steps,
        isActive: d.isActive,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'approval_workflow',
        entityId: workflow.id,
        entityName: workflow.name,
      },
    })

    return NextResponse.json({ success: true, data: workflow }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
