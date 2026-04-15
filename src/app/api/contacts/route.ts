import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { logCreate } from '@/lib/activity'
import { z } from 'zod'

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  decisionRole: z.enum(['DECISION_MAKER','INFLUENCER','USER','GATEKEEPER','CHAMPION','OTHER']).default('OTHER'),
  preferredLanguage: z.string().default('en'),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
  companyId: z.string().optional(),
  companyRole: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))
  const search = searchParams.get('search') || ''
  const companyId = searchParams.get('companyId') || ''
  const where: Record<string, unknown> = { tenantId: session.user.tenantId, archivedAt: null }
  if (search) where.OR = [{ firstName: { contains: search, mode: 'insensitive' as const } }, { lastName: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }, { jobTitle: { contains: search, mode: 'insensitive' as const } }]
  if (companyId) where.companyContacts = { some: { companyId } }
  try {
    const [data, total] = await Promise.all([
      prisma.contact.findMany({ where, include: { companyContacts: { include: { company: { select: { id: true, displayName: true } } }, where: { isPrimary: true }, take: 1 } }, orderBy: { createdAt: 'desc' }, skip: (page-1)*pageSize, take: pageSize }),
      prisma.contact.count({ where }),
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
    const contactNumber = await nextNumber(tenantId, 'contact')
    const contact = await prisma.contact.create({
      data: {
        tenantId, contactNumber,
        firstName: parsed.data.firstName, lastName: parsed.data.lastName,
        email: parsed.data.email || null, phone: parsed.data.phone || null, whatsapp: parsed.data.whatsapp || null,
        jobTitle: parsed.data.jobTitle || null, department: parsed.data.department || null,
        decisionRole: parsed.data.decisionRole, preferredLanguage: parsed.data.preferredLanguage,
        linkedinUrl: parsed.data.linkedinUrl || null, notes: parsed.data.notes || null,
        ...(parsed.data.companyId && { companyContacts: { create: { companyId: parsed.data.companyId, role: parsed.data.companyRole || null, isPrimary: true } } }),
      },
    })
    await prisma.auditLog.create({ data: { tenantId, userId, action: 'CREATE', entityType: 'contact', entityId: contact.id, entityName: `${contact.firstName} ${contact.lastName}` } })
    logCreate(tenantId, 'contact', contact.id, contact.firstName + ' ' + contact.lastName, userId)
    return NextResponse.json({ success: true, data: contact }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }) }
}
