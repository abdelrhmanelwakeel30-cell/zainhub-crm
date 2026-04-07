import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function getSession() {
  const session = await auth()
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

export function hasPermission(
  userPermissions: string[],
  required: string
): boolean {
  // Super admin has all permissions
  if (userPermissions.includes('*:*')) return true

  // Check exact match
  if (userPermissions.includes(required)) return true

  // Check module wildcard (e.g., "leads:*" matches "leads:view")
  const [module] = required.split(':')
  if (userPermissions.includes(`${module}:*`)) return true

  return false
}

export function hasAnyPermission(
  userPermissions: string[],
  required: string[]
): boolean {
  return required.some((p) => hasPermission(userPermissions, p))
}

export function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role) || userRoles.includes('Super Admin')
}
