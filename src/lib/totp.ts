import 'server-only'

/**
 * TOTP (RFC 6238) two-factor auth helpers (S-4).
 *
 * `otplib` is loaded lazily via dynamic import and every call is guarded, so
 * the build and runtime never hard-require the package. If it is absent,
 * `totpAvailable()` returns false and enroll/verify endpoints degrade to 503.
 */

const ISSUER = 'ZainHub BOS'

type OtpLib = {
  generateSecret: (opts?: { length?: number }) => string | Promise<string>
  generateURI: (opts: { issuer?: string; label: string; secret: string }) => string
  verify: (opts: { token: string; secret: string }) => { valid: boolean } | Promise<{ valid: boolean }>
}

let cached: OtpLib | null | undefined

async function load(): Promise<OtpLib | null> {
  if (cached !== undefined) return cached
  try {
    const mod = (await import('otplib')) as unknown as OtpLib
    cached = mod
  } catch {
    cached = null
  }
  return cached
}

export async function totpAvailable(): Promise<boolean> {
  return (await load()) !== null
}

/** Generate a fresh base32 TOTP secret (returns null if otplib is unavailable). */
export async function generateTotpSecret(): Promise<string | null> {
  const lib = await load()
  if (!lib) return null
  return await lib.generateSecret({ length: 20 })
}

/** Build an otpauth:// URI for QR provisioning. */
export async function buildOtpauthUri(secret: string, account: string): Promise<string | null> {
  const lib = await load()
  if (!lib) return null
  return lib.generateURI({ issuer: ISSUER, label: account, secret })
}

/** Verify a 6-digit TOTP token against the stored secret. */
export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const lib = await load()
  if (!lib) return false
  const clean = token.replace(/\D/g, '')
  if (clean.length !== 6) return false
  try {
    const res = await lib.verify({ token: clean, secret })
    return !!res?.valid
  } catch {
    return false
  }
}
