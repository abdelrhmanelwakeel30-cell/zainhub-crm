import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { assertTenantOwnsAll } from '@/lib/api-helpers'
import { log } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().min(1),
  type: z.enum(['DESIGN', 'CODE', 'DOCUMENT', 'REPORT', 'ASSET', 'OTHER']),
  visibility: z.enum(['INTERNAL', 'CLIENT', 'PUBLIC']),
  projectId: z.string().optional(),
  clientServiceId: z.string().optional(),
  description: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId') || ''
  const visibility = searchParams.get('visibility') || ''
  const type = searchParams.get('type') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (projectId) where.projectId = projectId
  if (visibility) where.visibility = visibility
  if (type) where.type = type
  try {
    const data = await prisma.deliverable.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 100, // P-001 defensive cap
    })
    return NextResponse.json({ success: true, data })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const { tenantId, id: userId } = session.user

    // T-002: every FK accepted from the body must belong to this tenant.
    await assertTenantOwnsAll(prisma, tenantId, [
      { model: 'project', id: parsed.data.projectId },
    ])

    const deliverable = await prisma.deliverable.create({
      data: {
        tenantId,
        name: parsed.data.name,
        fileUrl: parsed.data.fileUrl,
        type: parsed.data.type as 'OTHER',
        visibility: parsed.data.visibility as 'INTERNAL',
        projectId: parsed.data.projectId || null,
        clientServiceId: parsed.data.clientServiceId || null,
        description: parsed.data.description || null,
        fileName: parsed.data.fileName || null,
        fileSize: parsed.data.fileSize || null,
        mimeType: parsed.data.mimeType || null,
        uploadedById: userId,
      },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'deliverable', entityId: deliverable.id, entityName: deliverable.name } })
    return NextResponse.json({ success: true, data: deliverable }, { status: 201 })
  } catch (err) { log.error('error', { err: err }); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
