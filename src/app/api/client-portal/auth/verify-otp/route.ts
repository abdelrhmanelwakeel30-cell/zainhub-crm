import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SignJWT } from 'jose'
import { prisma as _prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

const VerifyOtpSchema = z.object({
  phone: z.string().min(5),
  otp: z.string().length(6),
})

function getJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = VerifyOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { phone, otp } = parsed.data

    const clientUser = await prisma.clientPortalUser.findFirst({
      where: {
        phone,
        otpCode: otp,
        otpExpiry: { gt: new Date() },
      },
    })

    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP.' },
        { status: 401 },
      )
    }

    // Mark phone verified & clear OTP fields
    await prisma.clientPortalUser.update({
      where: { id: clientUser.id },
      data: {
        phoneVerified: true,
        otpCode: null,
        otpExpiry: null,
        lastLoginAt: new Date(),
      },
    })

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      undefined
    const userAgent = req.headers.get('user-agent') ?? undefined

    const session = await prisma.clientPortalSession.create({
      data: {
        clientUserId: clientUser.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiresAt,
      },
    })

    const token = await new SignJWT({
      sub: clientUser.id,
      tenantId: clientUser.tenantId,
      sessionId: session.id,
      type: 'client_portal',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(getJwtSecret())

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        firstName: clientUser.firstName,
        lastName: clientUser.lastName,
        companyId: clientUser.companyId,
      },
    })
  } catch (err) {
    console.error('[client-portal/auth/verify-otp]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
