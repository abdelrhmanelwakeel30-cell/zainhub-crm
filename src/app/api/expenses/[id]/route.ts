import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, notFound, serverError, ok, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpdateExpenseSchema = z.object({
  vendorName: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  amount: z.number().positive().optional(),
  taxAmount: z.number().optional(),
  totalAmount: z.number().positive().optional(),
  expenseDate: z.string().optional(),
  paymentMethod: z.enum(['BANK_TRANSFER','CREDIT_CARD','CASH','CHECK','ONLINE','OTHER']).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  linkedProjectId: z.string().optional().nullable(),
  status: z.enum(['PENDING','APPROVED','PAID','REJECTED']).optional(),
}).passthrough()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const expense = await prisma.expense.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        linkedProject: { select: { id: true, projectNumber: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (!expense) return notFound('Expense not found')
    return ok(serializeDecimals(expense))
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.expense.findFirst({
      where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return notFound('Expense not found')

    const body = await req.json()
    const parsed = UpdateExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { expenseDate, status, ...rest } = parsed.data

    // Auto-set approvedBy if approving
    const approvalData: Record<string, unknown> = {}
    if (status === 'APPROVED' && existing.status !== 'APPROVED') {
      approvalData.approvedById = session.user.id
      approvalData.approvedAt = new Date()
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...rest,
        ...(status && { status }),
        ...(expenseDate && { expenseDate: new Date(expenseDate) }),
        ...approvalData,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'Expense',
        entityId: id,
        entityName: existing.expenseNumber,
      },
    })

    return ok(serializeDecimals(updated))
  } catch (err) {
    return serverError(err)
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    const { id } = await ctx.params

    const existing = await prisma.expense.findFirst({
      where: { id, tenantId: session.user.tenantId },
    })
    if (!existing) return notFound('Expense not found')

    await prisma.expense.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'Expense',
        entityId: id,
        entityName: existing.expenseNumber,
      },
    })

    return ok({ id, deleted: true })
  } catch (err) {
    return serverError(err)
  }
}
