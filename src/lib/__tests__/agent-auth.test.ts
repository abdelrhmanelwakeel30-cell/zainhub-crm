import { describe, it, expect, vi } from 'vitest'

// agent-auth imports server-only modules + the Prisma/Sentry chain. We only
// test the pure key primitives here, so stub the heavy deps (mirrors the
// approach in api-helpers.test.ts).
vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ headers: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))
vi.mock('@/lib/logger', () => ({ log: { warn: vi.fn(), error: vi.fn() } }))

const { generateAgentKey, hashKey } = await import('@/lib/agent-auth')

describe('generateAgentKey', () => {
  it('mints a zhk_-prefixed key with a matching sha256 hash and 12-char prefix', () => {
    const { key, keyHash, keyPrefix } = generateAgentKey()
    expect(key.startsWith('zhk_')).toBe(true)
    expect(keyPrefix).toBe(key.slice(0, 12))
    expect(keyPrefix.startsWith('zhk_')).toBe(true)
    // sha256 hex is 64 chars and must match hashKey(key)
    expect(keyHash).toMatch(/^[0-9a-f]{64}$/)
    expect(keyHash).toBe(hashKey(key))
  })

  it('produces unique keys across calls', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateAgentKey().key))
    expect(keys.size).toBe(50)
  })

  it('has sufficient entropy in the secret (>= 48 hex chars after prefix)', () => {
    const { key } = generateAgentKey()
    expect(key.slice(4).length).toBeGreaterThanOrEqual(48)
  })
})

describe('hashKey', () => {
  it('is deterministic', () => {
    expect(hashKey('zhk_abc')).toBe(hashKey('zhk_abc'))
  })

  it('differs for different inputs (no trivial collisions)', () => {
    expect(hashKey('zhk_aaa')).not.toBe(hashKey('zhk_aab'))
  })

  it('never stores the plaintext key inside the hash', () => {
    const secret = 'zhk_supersecretvalue'
    expect(hashKey(secret)).not.toContain('supersecret')
  })
})
