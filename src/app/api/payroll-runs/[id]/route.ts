import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({ action: z.enum(['process', 'mark-paid']) })

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const run = await prisma.payrollRun.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        payslips: {
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!run) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: run })
  } catch (err) {
    log.error('GET /api/payroll-runs/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId, permissions } = session.user

  const parsed = await parseJson(req, patchSchema)
  if (parsed instanceof NextResponse) return parsed
  const { action } = parsed.data

  const required = action === 'mark-paid' ? 'payroll:approve' : 'payroll:edit'
  if (!hasPermission(permissions, required)) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required }, { status: 403 })
  }

  try {
    const run = await prisma.payrollRun.findFirst({ where: { id, tenantId } })
    if (!run) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    if (action === 'process') {
      if (run.status !== 'DRAFT') {
        return NextResponse.json({ success: false, error: `Run is already ${run.status.toLowerCase()}` }, { status: 409 })
      }
      // Eligible: active, non-archived employees with a positive salary.
      const employees = await prisma.employee.findMany({
        where: { tenantId, status: 'ACTIVE', archivedAt: null, salary: { not: null } },
        select: { id: true, salary: true },
      })
      const eligible = employees.filter((e) => e.salary && Number(e.salary) > 0)
      let totalGross = 0
      let totalNet = 0
      const payslips = eligible.map((e) => {
        const gross = Number(e.salary)
        const deductions = 0
        const net = gross - deductions
        totalGross += gross
        totalNet += net
        return { tenantId, payrollRunId: id, employeeId: e.id, gross, deductions, net, currency: run.currency, status: 'PENDING' }
      })

      const updated = await prisma.$transaction(async (tx) => {
        if (payslips.length) await tx.payslip.createMany({ data: payslips })
        return tx.payrollRun.update({
          where: { id },
          data: { status: 'PROCESSED', processedAt: new Date(), totalGross, totalNet },
        })
      })
      await prisma.auditLog.create({
        data: { tenantId, userId, action: 'UPDATE', entityType: 'payroll', entityId: id, entityName: `${run.runNumber} processed — ${payslips.length} payslip(s)` },
      })
      return NextResponse.json({ success: true, data: updated, payslips: payslips.length })
    }

    // mark-paid
    if (run.status !== 'PROCESSED') {
      return NextResponse.json({ success: false, error: `Run must be processed before paying (currently ${run.status.toLowerCase()})` }, { status: 409 })
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({ where: { payrollRunId: id, tenantId }, data: { status: 'PAID' } })
      return tx.payrollRun.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } })
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'APPROVE', entityType: 'payroll', entityId: id, entityName: `${run.runNumber} paid` },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    log.error('PATCH /api/payroll-runs/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
