import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { totpAvailable } from '@/lib/totp'
import { log } from '@/lib/logger'

/** Current 2FA status for the signed-in user + server capability flag. */
export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    })
    return NextResponse.json({
      success: true,
      data: { enabled: !!user?.twoFactorEnabled, available: await totpAvailable() },
    })
  } catch (err) {
    log.error('GET /api/auth/2fa', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
