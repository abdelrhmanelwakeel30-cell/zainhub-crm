import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateMilestoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional().default('PENDING'),
  order: z.number().int().optional().default(0),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const clientService = await prisma.clientService.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    })
    if (!clientService) return notFound('Client service not found')

    const milestones = await prisma.clientServiceMilestone.findMany({
      where: { clientServiceId: id },
      orderBy: { order: 'asc' },
    })

    return ok(milestones)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('client_services:create')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const clientService = await prisma.clientService.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    })
    if (!clientService) return notFound('Client service not found')

    const body = await req.json()
    const parsed = CreateMilestoneSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { dueDate, ...rest } = parsed.data

    const milestone = await prisma.clientServiceMilestone.create({
      data: {
        clientServiceId: id,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        ...rest,
      },
    })

    return NextResponse.json({ success: true, data: milestone }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
