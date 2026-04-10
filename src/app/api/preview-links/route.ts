import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  type: z.enum(['WEBSITE', 'SYSTEM', 'PROTOTYPE', 'STAGING', 'DEMO', 'DESIGN']),
  projectId: z.string().optional(),
  clientServiceId: z.string().optional(),
  sharedWithCompanyId: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const projectId = searchParams.get('projectId') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status
  if (projectId) where.projectId = projectId
  try {
    const data = await prisma.previewLink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sharedByUser: { select: { id: true, firstName: true, lastName: true } },
        sharedWithCompany: { select: { id: true, displayName: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { feedbacks: true } },
      },
    })
    return NextResponse.json({ success: true, data })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const { tenantId, id: userId } = session.user
    const link = await prisma.previewLink.create({
      data: {
        tenantId,
        title: parsed.data.title,
        url: parsed.data.url,
        type: parsed.data.type as 'STAGING',
        projectId: parsed.data.projectId || null,
        clientServiceId: parsed.data.clientServiceId || null,
        sharedByUserId: userId,
        sharedWithCompanyId: parsed.data.sharedWithCompanyId || null,
        password: parsed.data.password || null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        notes: parsed.data.notes || null,
      },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'previewLink', entityId: link.id, entityName: link.title } })
    return NextResponse.json({ success: true, data: link }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
