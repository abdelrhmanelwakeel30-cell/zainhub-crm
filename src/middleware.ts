import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiRateLimit, exportRateLimit } from '@/lib/rate-limit'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Edge middleware — defense-in-depth.
 *
 * NOTE: This runs in the Edge runtime, which does not support Node's `crypto`
 * module. We therefore CANNOT call `auth()` (it imports Prisma via the
 * NextAuth config). Instead we do a lightweight presence check on the
 * NextAuth session cookie; per-route handlers still re-verify the session
 * via `getApiSession()` and enforce `tenantId` — this is just the outer
 * gate that short-circuits obviously unauthenticated traffic.
 */

const PUBLIC_API_PATHS = [
  '/api/auth',              // NextAuth handler
  '/api/public',            // Public forms
  '/api/client-portal',     // Portal (separate JWT)
  '/api/health',            // Health check
]

const PUBLIC_PAGE_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/portal',                // Client portal (separate auth)
]

// NextAuth chunks large session cookies into `.0`, `.1`, etc., so we match
// any cookie whose name starts with one of these prefixes.
const SESSION_COOKIE_PREFIXES = [
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
]

function hasSessionCookie(request: NextRequest): boolean {
  for (const c of request.cookies.getAll()) {
    if (SESSION_COOKIE_PREFIXES.some((p) => c.name === p || c.name.startsWith(p + '.'))) {
      if (c.value) return true
    }
  }
  return false
}

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
}

function isPublicPagePath(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) return NextResponse.next()
    if (!hasSessionCookie(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // S-006 / Fix-013 (CSRF): require Origin to match Host on mutating requests.
    // Same-origin browsers always send Origin; CSRF attempts cross-origin won't.
    if (MUTATING_METHODS.has(request.method)) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')
      if (origin) {
        try {
          if (new URL(origin).host !== host) {
            return NextResponse.json(
              { success: false, error: 'CSRF: origin mismatch' },
              { status: 403 },
            )
          }
        } catch {
          return NextResponse.json(
            { success: false, error: 'CSRF: malformed origin' },
            { status: 403 },
          )
        }
      }
    }

    // Fix-008: per-IP+route rate limit on /api/*. Stricter window for /export endpoints.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'anonymous'
    const limiter = pathname.includes('/export') ? exportRateLimit : apiRateLimit
    const r = await limiter.limit(`api:${ip}:${pathname}`)
    if (!r.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }

    return NextResponse.next()
  }

  if (!isPublicPagePath(pathname) && pathname !== '/') {
    if (!hasSessionCookie(request)) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
}
