/**
 * Pure permission helpers — safe to import in both Server and Client Components.
 * No server-side dependencies.
 */

export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes('*:*')) return true
  if (userPermissions.includes(required)) return true
  const [module] = required.split(':')
  if (userPermissions.includes(`${module}:*`)) return true
  return false
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => hasPermission(userPermissions, p))
}

export function hasRole(userRoles: string[], role: string): boolean {
  return userRoles.includes(role) || userRoles.includes('Super Admin')
}
