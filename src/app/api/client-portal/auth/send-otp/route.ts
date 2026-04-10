import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma as _prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

const SendOtpSchema = z.object({
  phone: z.string().min(5),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SendOtpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { phone } = parsed.data

    const clientUser = await prisma.clientPortalUser.findFirst({ where: { phone } })
    if (!clientUser) {
      // Return generic success to avoid phone enumeration
      return NextResponse.json({ success: true, message: 'If an account exists, an OTP was sent.' })
    }

    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.clientPortalUser.update({
      where: { id: clientUser.id },
      data: { otpCode: otp, otpExpiry },
    })

    // In production: send SMS via Twilio/etc
    // In dev: return the OTP in response
    const isDev = process.env.NODE_ENV !== 'production'
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone.',
      ...(isDev && { otp, note: 'DEV MODE: OTP included in response' }),
    })
  } catch (err) {
    console.error('[client-portal/auth/send-otp]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
