import { describe, it, expect, vi } from 'vitest'

// api-helpers.ts transitively imports auth -> prisma, which requires DATABASE_URL.
// We're only testing pure functions here, so stub out the auth chain.
vi.mock('@/lib/auth-utils', () => ({
  getApiSession: vi.fn(),
}))

const { parsePagination, sanitizeUpdateBody } = await import('@/lib/api-helpers')

describe('parsePagination', () => {
  it('clamps pageSize at 100 (P-001)', () => {
    const sp = new URLSearchParams({ page: '1', pageSize: '5000' })
    const { pageSize } = parsePagination(sp)
    expect(pageSize).toBe(100)
  })

  it('defaults page to 1 when missing', () => {
    expect(parsePagination(new URLSearchParams()).page).toBe(1)
  })

  it('defaults pageSize to 20 when missing', () => {
    expect(parsePagination(new URLSearchParams()).pageSize).toBe(20)
  })

  it('enforces page minimum 1 (no zero or negative pages)', () => {
    expect(parsePagination(new URLSearchParams({ page: '0' })).page).toBe(1)
    expect(parsePagination(new URLSearchParams({ page: '-5' })).page).toBe(1)
  })

  it('enforces pageSize minimum 1', () => {
    expect(parsePagination(new URLSearchParams({ pageSize: '0' })).pageSize).toBe(1)
    expect(parsePagination(new URLSearchParams({ pageSize: '-10' })).pageSize).toBe(1)
  })

  it('computes skip correctly', () => {
    const { skip } = parsePagination(new URLSearchParams({ page: '3', pageSize: '20' }))
    expect(skip).toBe(40)
  })
})

describe('sanitizeUpdateBody', () => {
  it('strips id, tenantId, createdAt, passwordHash and other never-writable fields', () => {
    const body = {
      id: 'cuid_evil',
      tenantId: 'tenant_other',
      createdAt: new Date(),
      passwordHash: '$argon2id$...',
      name: 'New name',
    }
    const out = sanitizeUpdateBody(body)
    expect(out).not.toHaveProperty('id')
    expect(out).not.toHaveProperty('tenantId')
    expect(out).not.toHaveProperty('createdAt')
    expect(out).not.toHaveProperty('passwordHash')
    expect(out).toEqual({ name: 'New name' })
  })

  it('preserves allowed fields', () => {
    const out = sanitizeUpdateBody({ name: 'A', email: 'a@b.co', active: true })
    expect(out).toEqual({ name: 'A', email: 'a@b.co', active: true })
  })

  it('drops undefined values but keeps null and empty string', () => {
    const out = sanitizeUpdateBody({ a: undefined, b: null, c: '' })
    expect(out).not.toHaveProperty('a')
    expect(out).toHaveProperty('b', null)
    expect(out).toHaveProperty('c', '')
  })

  it('returns empty object for non-objects', () => {
    expect(sanitizeUpdateBody(null)).toEqual({})
    expect(sanitizeUpdateBody(undefined)).toEqual({})
    expect(sanitizeUpdateBody('string')).toEqual({})
    expect(sanitizeUpdateBody([1, 2, 3])).toEqual({})
  })

  it('honours extraBlocked list', () => {
    const out = sanitizeUpdateBody({ name: 'A', secret: 's' }, ['secret'])
    expect(out).toEqual({ name: 'A' })
  })
})
