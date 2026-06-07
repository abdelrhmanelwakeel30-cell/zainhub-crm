import { NextRequest, NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const { id } = await params
  const { tenantId, id: userId } = guard.session.user

  try {
    const existing = await prisma.webhookEndpoint.findFirst({ where: { id, tenantId }, select: { id: true, url: true } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.webhookEndpoint.delete({ where: { id } })
    await prisma.auditLog.create({
      data: { tenantId, userId, action: 'DELETE', entityType: 'webhook', entityId: id, entityName: existing.url },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('DELETE /api/webhooks/[id]', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
