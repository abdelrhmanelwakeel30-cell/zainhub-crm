import { describe, it, expect } from 'vitest'
import { hasPermission, hasAnyPermission, hasRole } from '@/lib/permissions'

describe('hasPermission', () => {
  it('matches an exact permission', () => {
    expect(hasPermission(['websites:read'], 'websites:read')).toBe(true)
  })

  it('treats *:* as a global wildcard', () => {
    expect(hasPermission(['*:*'], 'anything:do')).toBe(true)
    expect(hasPermission(['*:*'], 'websites:delete')).toBe(true)
  })

  it('honours module wildcards (module:*)', () => {
    expect(hasPermission(['websites:*'], 'websites:read')).toBe(true)
    expect(hasPermission(['websites:*'], 'websites:delete')).toBe(true)
  })

  it('returns false when there is no match', () => {
    expect(hasPermission(['websites:read'], 'websites:write')).toBe(false)
    expect(hasPermission([], 'websites:read')).toBe(false)
    expect(hasPermission(['contacts:*'], 'websites:read')).toBe(false)
  })
})

describe('hasAnyPermission', () => {
  it('returns true when any required permission matches', () => {
    expect(hasAnyPermission(['websites:read'], ['websites:read', 'websites:write'])).toBe(true)
  })

  it('short-circuits on the first match', () => {
    // First required permission matches the only granted permission — should return true
    // even though subsequent required entries do not match.
    expect(hasAnyPermission(['websites:read'], ['websites:read', 'never:matches'])).toBe(true)
  })

  it('returns false when none of the required permissions match', () => {
    expect(hasAnyPermission(['contacts:read'], ['websites:read', 'websites:write'])).toBe(false)
  })

  it('returns false when required is empty', () => {
    expect(hasAnyPermission(['*:*'], [])).toBe(false)
  })
})

describe('hasRole', () => {
  it('matches the exact role', () => {
    expect(hasRole(['Admin'], 'Admin')).toBe(true)
  })

  it('recognises Super Admin as having any role', () => {
    expect(hasRole(['Super Admin'], 'Admin')).toBe(true)
    expect(hasRole(['Super Admin'], 'Sales')).toBe(true)
    expect(hasRole(['Super Admin'], 'NonexistentRole')).toBe(true)
  })

  it('returns false when role is not present', () => {
    expect(hasRole(['Sales'], 'Admin')).toBe(false)
    expect(hasRole([], 'Admin')).toBe(false)
  })
})
