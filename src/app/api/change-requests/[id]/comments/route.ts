import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateCommentSchema = z.object({
  content: z.string().min(1),
  authorType: z.enum(['INTERNAL', 'CLIENT']).optional().default('INTERNAL'),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const changeRequest = await prisma.changeRequest.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    })
    if (!changeRequest) return notFound('Change request not found')

    const comments = await prisma.changeRequestComment.findMany({
      where: { changeRequestId: id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return ok(serializeDecimals(comments))
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('change_requests:create')
  if (!__guard.ok) return __guard.response
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const changeRequest = await prisma.changeRequest.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true },
    })
    if (!changeRequest) return notFound('Change request not found')

    const body = await req.json()
    const parsed = CreateCommentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const comment = await prisma.changeRequestComment.create({
      data: {
        changeRequestId: id,
        authorId: session.user.id,
        authorType: parsed.data.authorType,
        content: parsed.data.content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(comment) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
