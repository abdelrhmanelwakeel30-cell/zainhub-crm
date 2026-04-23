import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  '/register',
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

export function middleware(request: NextRequest) {
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
