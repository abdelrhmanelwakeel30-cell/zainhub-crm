import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

/**
 * Returns the encoded PORTAL_JWT_SECRET for signing/verifying client-portal JWTs.
 *
 * S-009 (CRM-V3-FULL-AUDIT-2026-04-25.md): the previous implementation fell back
 * to NEXTAUTH_SECRET when PORTAL_JWT_SECRET was missing. That defeated the threat
 * model — a leaked staff session secret could forge portal tokens. This now
 * throws instead. Set PORTAL_JWT_SECRET in `.env.local` and Vercel env vars.
 */
export function getPortalJwtSecret(): Uint8Array {
  const secret = process.env.PORTAL_JWT_SECRET
  if (!secret) {
    throw new Error(
      'PORTAL_JWT_SECRET is required. Add it to .env.local (and Vercel env vars in prod).',
    )
  }
  return new TextEncoder().encode(secret)
}

export interface PortalTokenPayload {
  sub: string
  tenantId: string
  sessionId?: string
  type: string
}

/**
 * Verify a portal JWT against the signing secret AND the server-side session row.
 *
 * S-005 (CRM-V3-PRODUCTION-AUDIT-2026-04-25.md): previously this validated only
 * the JWT signature, so logout / password-reset / admin-disable were all
 * advisory — a leaked 30-day token remained valid. Now we also look up
 * ClientPortalSession by `payload.sessionId` and reject if `isRevoked`
 * or `expiresAt < now`.
 *
 * Tokens issued before this change carried `sessionId`, so existing sessions
 * keep working. Tokens minted without a `sessionId` are rejected as malformed.
 */
export async function verifyPortalToken(token: string): Promise<PortalTokenPayload | null> {
  let payload: PortalTokenPayload
  try {
    const { payload: raw } = await jwtVerify(token, getPortalJwtSecret())
    payload = raw as unknown as PortalTokenPayload
  } catch {
    return null
  }

  if (payload.type !== 'client_portal' || !payload.sub) return null
  if (!payload.sessionId) return null // legacy tokens without sessionId — refuse

  // Server-side session check (S-005)
  const session = await prisma.clientPortalSession.findUnique({
    where: { id: payload.sessionId },
    select: { isRevoked: true, expiresAt: true, clientUserId: true },
  })

  if (!session) return null // session row deleted
  if (session.isRevoked) return null // logged out / admin-disabled
  if (session.expiresAt.getTime() < Date.now()) return null // expired
  if (session.clientUserId !== payload.sub) return null // tampered token

  return payload
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
