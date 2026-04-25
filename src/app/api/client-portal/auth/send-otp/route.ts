import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomInt } from 'node:crypto'
import { prisma } from '@/lib/prisma'
const SendOtpSchema = z.object({
  phone: z.string().min(5),
})

/**
 * 6-digit OTP using crypto.randomInt (CSPRNG).
 * Replaces predictable Math.random() — S-001 in CRM-V3-FULL-AUDIT-2026-04-25.md.
 */
function generateOtp(): string {
  return randomInt(100000, 1000000).toString()
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

    // In production: send SMS via Twilio/etc.
    // The OTP is NEVER returned over the wire (S-003). For local testing,
    // tail the server logs — the line below logs in non-production only.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[client-portal/send-otp] DEV OTP for ${phone}: ${otp}`)
    }
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone.',
    })
  } catch (err) {
    console.error('[client-portal/auth/send-otp]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
