import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/** Delete or update (rename / set-default) a saved view. Owner-only. */

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
})

async function ownView(id: string, tenantId: string, userId: string) {
  return prisma.savedFilter.findFirst({ where: { id, tenantId, userId } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId } = session.user

  const parsed = await parseJson(req, patchSchema)
  if (parsed instanceof NextResponse) return parsed

  try {
    const existing = await ownView(id, tenantId, userId)
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    if (parsed.data.isDefault) {
      await prisma.savedFilter.updateMany({
        where: { tenantId, userId, module: existing.module, isDefault: true },
        data: { isDefault: false },
      })
    }
    const view = await prisma.savedFilter.update({
      where: { id },
      data: { ...parsed.data, filters: parsed.data.filters as object | undefined },
    })
    return NextResponse.json({ success: true, data: view })
  } catch (err) {
    log.error('PATCH /api/saved-views/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId } = session.user

  try {
    const existing = await ownView(id, tenantId, userId)
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.savedFilter.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('DELETE /api/saved-views/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
