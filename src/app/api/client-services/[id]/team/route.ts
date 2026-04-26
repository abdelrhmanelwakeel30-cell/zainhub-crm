import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['LEAD', 'SUPPORT', 'QA']).optional().default('SUPPORT'),
})

const RemoveMemberSchema = z.object({
  userId: z.string().min(1),
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

    const members = await prisma.clientServiceTeamMember.findMany({
      where: { clientServiceId: id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    return ok(members)
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
    const parsed = AddMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const member = await prisma.clientServiceTeamMember.upsert({
      where: {
        clientServiceId_userId: { clientServiceId: id, userId: parsed.data.userId },
      },
      update: { role: parsed.data.role },
      create: {
        clientServiceId: id,
        userId: parsed.data.userId,
        role: parsed.data.role,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: member }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('client_services:delete')
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
    const parsed = RemoveMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    await prisma.clientServiceTeamMember.deleteMany({
      where: { clientServiceId: id, userId: parsed.data.userId },
    })

    return ok({ removed: true })
  } catch (err) {
    return serverError(err)
  }
}
