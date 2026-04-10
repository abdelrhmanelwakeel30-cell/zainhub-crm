import { jwtVerify } from 'jose'

function getPortalJwtSecret() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set')
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
