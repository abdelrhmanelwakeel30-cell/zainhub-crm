import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
export { hasPermission, hasAnyPermission, hasRole } from '@/lib/permissions'

export async function getSession() {
  const session = await auth()
  return session
}

/**
 * For use in API Route Handlers (returns null instead of redirecting).
 * Always returns null if unauthenticated — caller must return 401.
 */
export async function getApiSession() {
  const session = await auth()
  if (!session?.user?.tenantId) return null
  return session
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

export async function requirePermission(permission: string) {
  const session = await requireAuth()
  if (!hasPermission(session.user.permissions, permission)) {
    redirect('/unauthorized')
  }
  return session
}

