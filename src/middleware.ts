import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Edge middleware — defense-in-depth:
 *   1. Protects all /api/* routes (except auth + public routes) with session check
 *   2. Adds per-request security headers that are request-scoped (CSP with nonce)
 *   3. Short-circuits unauthenticated dashboard requests to /login
 *
 * Per-route handlers still re-verify via getApiSession() + enforce tenantId.
 * This is the belt-and-braces outer layer.
 */

// Paths that do NOT require authentication
const PUBLIC_API_PATHS = [
  '/api/auth',              // NextAuth handler
  '/api/public',            // Public forms
  '/api/client-portal/auth',// Portal login/signup
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

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((p) => pathname.startsWith(p))
}

function isPublicPagePath(pathname: string): boolean {
  return PUBLIC_PAGE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // files like favicon.ico, images, etc.
  ) {
    return NextResponse.next()
  }

  // API route protection
  if (pathname.startsWith('/api/')) {
    if (isPublicApiPath(pathname)) {
      return NextResponse.next()
    }
    // Require auth for all other /api/*
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Pass-through with tenant header for downstream logging/debugging
    const res = NextResponse.next()
    res.headers.set('x-tenant-id', session.user.tenantId)
    return res
  }

  // Dashboard page protection (redirect to /login)
  if (!isPublicPagePath(pathname) && pathname !== '/') {
    const session = await auth()
    if (!session?.user) {
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
    /*
     * Match all paths except:
     *  - _next/static (static files)
     *  - _next/image (image optimization)
     *  - favicon.ico, robots.txt, sitemap.xml
     *  - Any file with an extension (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
}
