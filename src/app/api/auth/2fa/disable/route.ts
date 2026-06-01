import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

/** Disable TOTP for the current user (clears secret + enabled flag). */
export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    })
    return NextResponse.json({ success: true, data: { twoFactorEnabled: false } })
  } catch (err) {
    log.error('POST /api/auth/2fa/disable', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
