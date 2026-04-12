import { getApiSession } from '@/lib/auth-utils'
import { NextResponse } from 'next/server'
import { ZodError, type ZodType } from 'zod'

export async function getSession() {
  return await getApiSession()
}

/**
 * Parse and validate an incoming request body against a Zod schema.
 * Returns a NextResponse on failure (caller should `return` it) or the
 * parsed data on success. Use like:
 *
 *   const parsed = await parseJson(req, SomeSchema)
 *   if (parsed instanceof NextResponse) return parsed
 *   // use parsed.data
 */
export async function parseJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | NextResponse> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const err = result.error as ZodError
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        issues: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 422 },
    )
  }
  return { data: result.data }
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export function notFound(msg = 'Not found') {
  return NextResponse.json({ success: false, error: msg }, { status: 404 })
}

export function badRequest(msg: string) {
  return NextResponse.json({ success: false, error: msg }, { status: 400 })
}

export function serverError(err: unknown) {
  const msg = err instanceof Error ? err.message : 'Internal server error'
  console.error('[API Error]', err)
  return NextResponse.json({ success: false, error: msg }, { status: 500 })
}

export function ok<T>(data: T, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: true, data: serializeDecimals(data), ...extra })
}

export function paginatedOk<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return NextResponse.json({
    success: true,
    data: serializeDecimals(data),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

/** Parse pagination params from URL */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

/**
 * Strip fields that should never be writable from a client update body.
 *
 * This is the last-line defence against mass-assignment. Even if an endpoint
 * forgets to allowlist fields, this helper drops the dangerous ones before
 * they reach Prisma.update().
 *
 * Keep this list in sync with any new audit / tenancy columns you add.
 */
const NEVER_WRITABLE = new Set([
  'id',
  'tenantId',
  'createdAt',
  'updatedAt',
  'archivedAt',
  'createdById',
  'createdBy',
  'passwordHash',
  'password',
  'emailVerifiedAt',
  'twoFactorSecret',
  'inviteToken',
  'verificationToken',
  'resetPasswordToken',
  'resetPasswordExpires',
  'stripeCustomerId',
  'stripeSubscriptionId',
  'apiKey',
  'apiSecret',
  'webhookSecret',
])

export function sanitizeUpdateBody<T extends Record<string, unknown>>(
  body: unknown,
  extraBlocked: string[] = [],
): Partial<T> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {}
  const out: Record<string, unknown> = {}
  const blocked = new Set([...NEVER_WRITABLE, ...extraBlocked])
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (blocked.has(k)) continue
    if (v === undefined) continue
    out[k] = v
  }
  return out as Partial<T>
}

/** Convert Prisma Decimal fields to numbers recursively */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj
  if (typeof obj === 'object' && typeof obj.toNumber === 'function') return obj.toNumber()
  if (Array.isArray(obj)) return obj.map(serializeDecimals)
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const key of Object.keys(obj)) {
      result[key] = serializeDecimals(obj[key])
    }
    return result
  }
  return obj
}
