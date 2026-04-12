import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { z } from 'zod'

const createSchema = z.object({
  legalName: z.string().min(2),
  displayName: z.string().min(2),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  taxRegistrationNumber: z.string().optional(),
  linkedinUrl: z.string().optional(),
  lifecycleStage: z.enum(['LEAD','PROSPECT','CUSTOMER','PARTNER','VENDOR','FORMER_CUSTOMER']).default('LEAD'),
  accountOwnerId: z.string().optional(),
  annualRevenue: z.number().optional().nullable(),
  employeeCount: z.number().int().optional().nullable(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const lifecycleStage = searchParams.get('lifecycleStage') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId, archivedAt: null }
  if (search) where.OR = [{ displayName: { contains: search, mode: 'insensitive' as const } }, { legalName: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }]
  if (lifecycleStage) where.lifecycleStage = lifecycleStage
  try {
    const [data, total] = await Promise.all([
      prisma.company.findMany({ where, include: { accountOwner: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }),
      prisma.company.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total/pageSize) })
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
    const companyNumber = await nextNumber(tenantId, 'company')
    const company = await prisma.company.create({
      data: { tenantId, companyNumber, ...parsed.data, email: parsed.data.email || null, accountOwnerId: parsed.data.accountOwnerId || userId },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'company', entityId: company.id, entityName: company.displayName } })
    logCreate(tenantId, 'company', company.id, company.displayName, userId)
    return NextResponse.json({ success: true, data: company }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
