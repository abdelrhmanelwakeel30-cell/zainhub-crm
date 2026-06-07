import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getApiSession } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { verifyTotp } from '@/lib/totp'
import { log } from '@/lib/logger'

const schema = z.object({ token: z.string().min(6).max(10) })

/**
 * Confirm TOTP enrollment: verify a code against the pending secret and, on
 * success, flip twoFactorEnabled=true. Used both to activate and to re-verify.
 */
export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const parsed = await parseJson(req, schema)
  if (parsed instanceof NextResponse) return parsed

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorSecret: true },
    })
    if (!user?.twoFactorSecret) {
      return NextResponse.json({ success: false, error: 'No enrollment in progress. Call /enroll first.' }, { status: 400 })
    }
    const valid = await verifyTotp(user.twoFactorSecret, parsed.data.token)
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Invalid code', valid: false }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    })
    return NextResponse.json({ success: true, data: { valid: true, twoFactorEnabled: true } })
  } catch (err) {
    log.error('POST /api/auth/2fa/verify', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
