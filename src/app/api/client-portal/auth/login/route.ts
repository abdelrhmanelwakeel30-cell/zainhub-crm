import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'
import { getPortalJwtSecret } from '@/lib/portal-auth'
import { loginRateLimit } from '@/lib/rate-limit'
import { log } from '@/lib/logger'
// S-016: tenantSlug MUST be present. Without it, findFirst by email
// matches the first user across all tenants — auth oracle + wrong-tenant login.
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, tenantSlug } = parsed.data

    // S-002: rate limit credential-stuffing on the portal endpoint.
    // Use email + IP so rotating IPs don't bypass and rotating emails per IP also can't.
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'
    const rl = await loginRateLimit.limit(`portal-login:${email.toLowerCase()}:${ip}`)
    if (!rl.success) {
      console.warn('[client-portal/login] rate limit hit', { email, ip })
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': '900' } },
      )
    }

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

    // S-011: collapse all authentication failures to a single generic 401 to prevent
    // account enumeration. Distinct reasons (no user, bad password, inactive,
    // unverified) are logged server-side only.
    const denyReason: string | null =
      !clientUser || !clientUser.passwordHash
        ? 'no-user-or-no-password'
        : !(await bcrypt.compare(password, clientUser.passwordHash))
          ? 'wrong-password'
          : clientUser.status !== 'ACTIVE'
            ? 'inactive'
            : !clientUser.emailVerified
              ? 'unverified'
              : null

    if (denyReason || !clientUser) {
      console.warn(`[client-portal/login] denied ${email}: ${denyReason ?? 'no-user'}`)
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
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
      .sign(getPortalJwtSecret())

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
    log.error('[client-portal/auth/login]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
