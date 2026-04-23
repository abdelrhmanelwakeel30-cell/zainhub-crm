import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { prisma as _prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
})

function getJwtSecret() {
  const secret = process.env.PORTAL_JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('PORTAL_JWT_SECRET (or NEXTAUTH_SECRET) is not set')
  return new TextEncoder().encode(secret)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, tenantSlug } = parsed.data

    // Build where clause: find the user, optionally scoped by tenant slug
    let tenantId: string | undefined
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
      if (!tenant) {
        return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
      }
      tenantId = tenant.id
    }

    const clientUser = await prisma.clientPortalUser.findFirst({
      where: {
        email,
        ...(tenantId && { tenantId }),
      },
    })

    if (!clientUser || !clientUser.passwordHash) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, clientUser.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    if (clientUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Account is not active. Please verify your email or contact support.' },
        { status: 403 },
      )
    }

    if (!clientUser.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email not verified. Please check your inbox.' },
        { status: 403 },
      )
    }

    // Create session record
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
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

    // Update last login
    await prisma.clientPortalUser.update({
      where: { id: clientUser.id },
      data: { lastLoginAt: new Date() },
    })

    // Sign JWT
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
    console.error('[client-portal/auth/login]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
