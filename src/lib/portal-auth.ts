import { jwtVerify } from 'jose'

function getPortalJwtSecret() {
  // Prefer a dedicated portal secret so a staff-session leak does not forge
  // portal tokens (and vice-versa). Fall back to NEXTAUTH_SECRET for backwards
  // compat in dev — production MUST set PORTAL_JWT_SECRET.
  const secret = process.env.PORTAL_JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('PORTAL_JWT_SECRET (or NEXTAUTH_SECRET) is not set')
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.PORTAL_JWT_SECRET
  ) {
    console.warn(
      '[security] PORTAL_JWT_SECRET not set in production; using NEXTAUTH_SECRET as fallback. Rotate and configure PORTAL_JWT_SECRET.'
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
