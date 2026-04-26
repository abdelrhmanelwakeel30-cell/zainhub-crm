import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

import { log } from '@/lib/logger'
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id, itemId } = await params
  try {
    const bundle = await prisma.serviceBundle.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!bundle) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const item = await prisma.serviceBundleItem.findFirst({ where: { id: itemId, bundleId: id } })
    if (!item) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })

    await prisma.serviceBundleItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
