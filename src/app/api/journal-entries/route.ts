import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { parseQuery, paginationQuery } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
import { log } from '@/lib/logger'
import { z } from 'zod'

const listQuery = z.object({
  ...paginationQuery,
  status: z.enum(['DRAFT', 'POSTED']).optional(),
})

const lineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
  description: z.string().optional(),
})

const createSchema = z.object({
  date: z.string().min(1),
  memo: z.string().optional(),
  lines: z.array(lineSchema).min(2),
})

const round2 = (n: number) => Math.round(n * 100) / 100

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { page, pageSize, status } = q.data

  const where: Record<string, unknown> = { tenantId: session.user.tenantId }
  if (status) where.status = status

  try {
    const [data, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: { _count: { select: { lines: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.journalEntry.count({ where }),
    ])
    return NextResponse.json({ success: true, data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    log.error('GET /api/journal-entries', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiPermission('accounting:create')
  if (!guard.ok) return guard.response
  const { tenantId, id: userId } = guard.session.user

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    const d = parsed.data

    // Double-entry validation: debits must equal credits and be > 0.
    const totalDebit = round2(d.lines.reduce((s, l) => s + l.debit, 0))
    const totalCredit = round2(d.lines.reduce((s, l) => s + l.credit, 0))
    if (totalDebit !== totalCredit || totalDebit <= 0) {
      return NextResponse.json(
        { success: false, error: `Entry must balance: debits (${totalDebit}) must equal credits (${totalCredit}) and be greater than zero` },
        { status: 422 },
      )
    }
    // Each line is exactly one of debit XOR credit.
    if (d.lines.some((l) => (l.debit > 0 && l.credit > 0) || (l.debit === 0 && l.credit === 0))) {
      return NextResponse.json({ success: false, error: 'Each line must have either a debit or a credit (not both, not neither)' }, { status: 422 })
    }
    // All accounts must belong to this tenant.
    const accountIds = [...new Set(d.lines.map((l) => l.accountId))]
    const owned = await prisma.account.count({ where: { tenantId, id: { in: accountIds } } })
    if (owned !== accountIds.length) {
      return NextResponse.json({ success: false, error: 'One or more accounts are invalid' }, { status: 422 })
    }

    const entryNumber = await nextNumber(tenantId, 'journal', { prefix: 'JE' })
    const entry = await prisma.$transaction(async (tx) => {
      const e = await tx.journalEntry.create({
        data: { tenantId, entryNumber, date: new Date(d.date), memo: d.memo || null, status: 'DRAFT' },
      })
      await tx.journalLine.createMany({
        data: d.lines.map((l) => ({ tenantId, journalEntryId: e.id, accountId: l.accountId, debit: l.debit, credit: l.credit, description: l.description || null })),
      })
      return e
    })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'CREATE', entityType: 'journal_entry', entityId: entry.id, entityName: `${entry.entryNumber} (${totalDebit})` },
    })
    return NextResponse.json({ success: true, data: entry, totalDebit, totalCredit }, { status: 201 })
  } catch (err) {
    log.error('POST /api/journal-entries', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
