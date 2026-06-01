import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({ action: z.literal('post') })

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: { lines: { include: { account: { select: { id: true, code: true, name: true, type: true } } } } },
    })
    if (!entry) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: entry })
  } catch (err) {
    log.error('GET /api/journal-entries/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

/** Post a draft journal entry (locks it). Requires accounting:approve. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId, permissions } = session.user

  const parsed = await parseJson(req, patchSchema)
  if (parsed instanceof NextResponse) return parsed

  if (!hasPermission(permissions, 'accounting:approve')) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required: 'accounting:approve' }, { status: 403 })
  }

  try {
    const entry = await prisma.journalEntry.findFirst({ where: { id, tenantId }, select: { id: true, status: true, entryNumber: true } })
    if (!entry) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (entry.status !== 'DRAFT') return NextResponse.json({ success: false, error: 'Entry is already posted' }, { status: 409 })

    const updated = await prisma.journalEntry.update({ where: { id }, data: { status: 'POSTED', postedAt: new Date() } })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'APPROVE', entityType: 'journal_entry', entityId: id, entityName: `${entry.entryNumber} posted` },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    log.error('PATCH /api/journal-entries/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
