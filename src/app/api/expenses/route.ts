import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, paginatedOk, parsePagination, serializeDecimals } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const CreateExpenseSchema = z.object({
  vendorName: z.string().min(1),
  categoryId: z.string(),
  amount: z.number().positive(),
  taxAmount: z.number().optional().default(0),
  totalAmount: z.number().positive(),
  currency: z.enum(['AED','SAR','USD','EUR','GBP','EGP','KWD','QAR','BHD','OMR']).optional().default('AED'),
  expenseDate: z.string(),
  paymentMethod: z.enum(['BANK_TRANSFER','CREDIT_CARD','CASH','CHECK','ONLINE','OTHER']).optional().default('BANK_TRANSFER'),
  description: z.string().optional(),
  notes: z.string().optional(),
  linkedProjectId: z.string().optional(),
  status: z.enum(['PENDING','APPROVED','PAID','REJECTED']).optional().default('PENDING'),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(searchParams)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const projectId = searchParams.get('projectId') || ''

    const where: Record<string, unknown> = {
      tenantId: session.user.tenantId,
      ...(search && {
        OR: [
          { vendorName: { contains: search } },
          { description: { contains: search } },
          { expenseNumber: { contains: search } },
        ],
      }),
      ...(status && { status }),
      ...(categoryId && { categoryId }),
      ...(projectId && { linkedProjectId: projectId }),
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          linkedProject: { select: { id: true, projectNumber: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.expense.count({ where }),
    ])

    return paginatedOk(serializeDecimals(data), total, page, pageSize)
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = CreateExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const tenantId = session.user.tenantId
    const count = await prisma.expense.count({ where: { tenantId } })
    const expenseNumber = `EXP-${String(count + 1).padStart(4, '0')}`

    const { expenseDate, ...rest } = parsed.data

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        expenseNumber,
        createdById: session.user.id,
        expenseDate: new Date(expenseDate),
        ...rest,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'Expense',
        entityId: expense.id,
        entityName: expense.expenseNumber,
      },
    })

    return NextResponse.json({ success: true, data: serializeDecimals(expense) }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
