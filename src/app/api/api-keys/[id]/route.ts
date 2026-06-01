import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

/** Revoke (soft) a tenant API key. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const { id } = await params
  const { tenantId, id: userId } = guard.session.user

  try {
    const existing = await prisma.apiKey.findFirst({ where: { id, tenantId }, select: { id: true, name: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'UPDATE', entityType: 'api_key', entityId: id, entityName: `${existing.name} revoked` },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('DELETE /api/api-keys/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
