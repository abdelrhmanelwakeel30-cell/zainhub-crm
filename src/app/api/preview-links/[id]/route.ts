import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { sanitizeUpdateBody } from '@/lib/api-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const link = await prisma.previewLink.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        sharedByUser: { select: { id: true, firstName: true, lastName: true } },
        sharedWithCompany: { select: { id: true, displayName: true } },
        project: { select: { id: true, name: true } },
        feedbacks: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!link) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: link })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const existing = await prisma.previewLink.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    const raw = await req.json()
    const body = sanitizeUpdateBody<Record<string, unknown>>(raw, ['sharedById', 'shareToken', 'viewCount']) as Record<string, unknown>
    const link = await prisma.previewLink.update({ where: { id }, data: body })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'UPDATE', entityType: 'previewLink', entityId: id, entityName: link.title } })
    return NextResponse.json({ success: true, data: link })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const link = await prisma.previewLink.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!link) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.previewLink.delete({ where: { id } })
    await prisma.auditLog.create({ data: { tenantId: session.user.tenantId, userId: session.user.id, action: 'DELETE', entityType: 'previewLink', entityId: id, entityName: link.title } })
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
