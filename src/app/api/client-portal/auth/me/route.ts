import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { getPortalJwtSecret } from '@/lib/portal-auth'
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Missing or invalid Authorization header' }, { status: 401 })
    }

    const token = authHeader.slice(7)

    let payload: { sub?: string; tenantId?: string; sessionId?: string; type?: string }
    try {
      const result = await jwtVerify(token, getPortalJwtSecret())
      payload = result.payload as typeof payload
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    if (payload.type !== 'client_portal' || !payload.sub) {
      return NextResponse.json({ success: false, error: 'Invalid token type' }, { status: 401 })
    }

    // Check the session is still valid
    if (payload.sessionId) {
      const session = await prisma.clientPortalSession.findFirst({
        where: {
          id: payload.sessionId,
          clientUserId: payload.sub,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      })
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session expired or revoked' }, { status: 401 })
      }
      // Touch lastActiveAt
      await prisma.clientPortalSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      })
    }

    const clientUser = await prisma.clientPortalUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        emailVerified: true,
        status: true,
        companyId: true,
        contactId: true,
        mfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        company: {
          select: { id: true, displayName: true },
        },
      },
    })

    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (clientUser.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Account is not active' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: clientUser })
  } catch (err) {
    console.error('[client-portal/auth/me]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
