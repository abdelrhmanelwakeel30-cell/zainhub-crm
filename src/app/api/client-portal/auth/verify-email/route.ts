import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Verification token is required.' }, { status: 400 })
    }

    const clientUser = await prisma.clientPortalUser.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: { gt: new Date() },
      },
    })

    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token.' },
        { status: 400 },
      )
    }

    await prisma.clientPortalUser.update({
      where: { id: clientUser.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, message: 'Email verified successfully. You can now sign in.' })
  } catch (err) {
    log.error('[client-portal/auth/verify-email]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
