import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { parseQuery, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

/**
 * Saved views / persisted filters (C-4), backed by the SavedFilter model.
 * Scoped to tenant + module; a user sees their own views plus any shared ones.
 */

const listQuery = z.object({ module: z.string().min(1).max(50) })

const createSchema = z.object({
  name: z.string().min(1).max(80),
  module: z.string().min(1).max(50),
  filters: z.record(z.string(), z.unknown()).default({}),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const q = parseQuery(new URL(req.url).searchParams, listQuery)
  if (q instanceof NextResponse) return q
  const { tenantId, id: userId } = session.user

  try {
    const data = await prisma.savedFilter.findMany({
      where: { tenantId, module: q.data.module, OR: [{ userId }, { isShared: true }] },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    log.error('GET /api/saved-views', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJson(req, createSchema)
  if (parsed instanceof NextResponse) return parsed
  const { tenantId, id: userId } = session.user
  const { name, module, filters, isDefault, isShared } = parsed.data

  try {
    // Only one default per (user, module): clear any prior default first.
    if (isDefault) {
      await prisma.savedFilter.updateMany({ where: { tenantId, userId, module, isDefault: true }, data: { isDefault: false } })
    }
    const view = await prisma.savedFilter.create({
      data: { tenantId, userId, name, module, filters: filters as object, isDefault, isShared },
    })
    return NextResponse.json({ success: true, data: view }, { status: 201 })
  } catch (err) {
    log.error('POST /api/saved-views', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
