import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logCreate } from '@/lib/activity'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  category: z.enum([
    'PROPOSAL', 'CONTRACT', 'INVOICE', 'RECEIPT', 'BRIEF',
    'ASSET', 'BRAND', 'ID_DOCUMENT', 'REPORT', 'OTHER',
  ]).default('OTHER'),
  linkedEntityType: z.string().optional(),
  linkedEntityId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || 20)))
  const category = searchParams.get('category')
  const linkedEntityType = searchParams.get('linkedEntityType')
  const linkedEntityId = searchParams.get('linkedEntityId')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (category) where.category = category
  if (linkedEntityType) where.linkedEntityType = linkedEntityType
  if (linkedEntityId) where.linkedEntityId = linkedEntityId
  if (search) where.name = { contains: search, mode: 'insensitive' }

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const doc = await prisma.document.create({
      data: {
        tenantId: session.user.tenantId,
        uploadedById: session.user.id,
        ...parsed.data,
      },
    })

    logCreate(session.user.tenantId, 'document', doc.id, doc.name, session.user.id)

    return NextResponse.json({ success: true, data: doc }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
