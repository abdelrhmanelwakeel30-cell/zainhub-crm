import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  content: z.string().min(1),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const link = await prisma.previewLink.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!link) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const feedbacks = await prisma.previewFeedback.findMany({
      where: { previewLinkId: id },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: feedbacks })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const link = await prisma.previewLink.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!link) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const feedback = await prisma.previewFeedback.create({
      data: {
        previewLinkId: id,
        authorId: session.user.id,
        authorType: 'INTERNAL',
        content: parsed.data.content,
        status: 'OPEN',
      },
    })
    return NextResponse.json({ success: true, data: feedback }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
