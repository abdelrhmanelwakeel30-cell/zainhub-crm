import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { totpAvailable, generateTotpSecret, buildOtpauthUri } from '@/lib/totp'
import { log } from '@/lib/logger'

/**
 * Begin TOTP enrollment for the current staff user. Generates and stores a
 * secret (NOT yet enabled — POST /api/auth/2fa/verify confirms it) and returns
 * the otpauth URI + secret for QR provisioning. Service accounts cannot enroll.
 */
export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (!(await totpAvailable())) {
    return NextResponse.json({ success: false, error: '2FA is not available on this server' }, { status: 503 })
  }
  try {
    const secret = await generateTotpSecret()
    if (!secret) {
      return NextResponse.json({ success: false, error: '2FA is not available on this server' }, { status: 503 })
    }
    const uri = await buildOtpauthUri(secret, session.user.email ?? session.user.id)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    })
    return NextResponse.json({ success: true, data: { secret, otpauthUri: uri } })
  } catch (err) {
    log.error('POST /api/auth/2fa/enroll', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
