import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { sanitizeUpdateBody } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
  hireDate: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  salary: z.number().nonnegative().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
        leaveRequests: { orderBy: { startDate: 'desc' }, take: 20 },
      },
    })
    if (!employee) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: employee })
  } catch (err) {
    log.error('GET /api/employees/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('employees:edit')
  if (!guard.ok) return guard.response
  const { id } = await params
  const { tenantId, id: userId } = guard.session.user

  try {
    const existing = await prisma.employee.findFirst({ where: { id, tenantId }, select: { id: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    if (parsed.data.managerId) {
      if (parsed.data.managerId === id) return NextResponse.json({ success: false, error: 'An employee cannot manage themselves' }, { status: 422 })
      const mgr = await prisma.employee.findFirst({ where: { id: parsed.data.managerId, tenantId }, select: { id: true } })
      if (!mgr) return NextResponse.json({ success: false, error: 'Invalid manager' }, { status: 422 })
    }

    const clean = sanitizeUpdateBody(parsed.data)
    const data: Record<string, unknown> = { ...clean }
    if ('hireDate' in clean) data.hireDate = clean.hireDate ? new Date(clean.hireDate as string) : null
    if ('email' in clean) data.email = (clean.email as string) || null

    const employee = await prisma.employee.update({ where: { id }, data })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'UPDATE', entityType: 'employee', entityId: id, entityName: `${employee.firstName} ${employee.lastName}` },
    })
    return NextResponse.json({ success: true, data: employee })
  } catch (err) {
    log.error('PATCH /api/employees/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('employees:delete')
  if (!guard.ok) return guard.response
  const { id } = await params
  const { tenantId, id: userId } = guard.session.user

  try {
    const existing = await prisma.employee.findFirst({ where: { id, tenantId }, select: { id: true, firstName: true, lastName: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.employee.update({ where: { id }, data: { archivedAt: new Date() } })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'ARCHIVE', entityType: 'employee', entityId: id, entityName: `${existing.firstName} ${existing.lastName}` },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('DELETE /api/employees/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
