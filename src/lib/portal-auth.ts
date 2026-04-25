import { jwtVerify } from 'jose'

/**
 * Returns the encoded PORTAL_JWT_SECRET for signing/verifying client-portal JWTs.
 *
 * S-009 (CRM-V3-FULL-AUDIT-2026-04-25.md): the previous implementation fell back
 * to NEXTAUTH_SECRET when PORTAL_JWT_SECRET was missing. That defeated the threat
 * model — a leaked staff session secret could forge portal tokens. This now
 * throws instead. Set PORTAL_JWT_SECRET in `.env.local` and Vercel env vars.
 *
 * Exported so portal route handlers stop duplicating this logic (they used to
 * each have their own copy with the same fallback bug).
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

export async function verifyPortalToken(token: string): Promise<PortalTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getPortalJwtSecret())
    const p = payload as unknown as PortalTokenPayload
    if (p.type !== 'client_portal' || !p.sub) return null
    return p
  } catch {
    return null
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
