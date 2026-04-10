import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const fieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'phone', 'textarea', 'select']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
})

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
  sourceTag: z.string().optional(),
  assignToId: z.string().optional(),
  isActive: z.boolean().default(true),
  redirectUrl: z.string().optional(),
  thankYouMsg: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const where = { tenantId: session.user.tenantId }
  try {
    const [data, total] = await Promise.all([
      prisma.leadCaptureForm.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          assignTo: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.leadCaptureForm.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total })
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

    const { tenantId, id: userId } = session.user

    // Check slug uniqueness
    const existing = await prisma.leadCaptureForm.findFirst({ where: { tenantId, slug: parsed.data.slug } })
    if (existing) return NextResponse.json({ success: false, error: 'Slug already in use' }, { status: 409 })

    const form = await prisma.leadCaptureForm.create({
      data: {
        tenantId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        fields: JSON.stringify(parsed.data.fields),
        sourceTag: parsed.data.sourceTag || null,
        assignToId: parsed.data.assignToId || null,
        isActive: parsed.data.isActive,
        redirectUrl: parsed.data.redirectUrl || null,
        thankYouMsg: parsed.data.thankYouMsg || null,
      },
      include: {
        assignTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'CREATE',
        entityType: 'leadCaptureForm',
        entityId: form.id,
        entityName: form.name,
      },
    })

    return NextResponse.json({ success: true, data: form }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
