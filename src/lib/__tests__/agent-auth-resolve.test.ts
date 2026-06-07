import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the heavy deps before importing the module under test.
vi.mock('server-only', () => ({}))
const headersMock = vi.fn()
vi.mock('next/headers', () => ({ headers: headersMock }))

const agentFindUnique = vi.fn()
const agentUpdate = vi.fn().mockResolvedValue({})
const apiKeyFindUnique = vi.fn()
const apiKeyUpdate = vi.fn().mockResolvedValue({})
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agentApiKey: { findUnique: (...a: unknown[]) => agentFindUnique(...a), update: (...a: unknown[]) => agentUpdate(...a) },
    apiKey: { findUnique: (...a: unknown[]) => apiKeyFindUnique(...a), update: (...a: unknown[]) => apiKeyUpdate(...a) },
  },
}))
vi.mock('@/lib/logger', () => ({ log: { warn: vi.fn(), error: vi.fn() } }))

const { getAgentSession, generateAgentKey, generateApiKey, hashKey } = await import('@/lib/agent-auth')

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1', tenantId: 't1', status: 'ACTIVE', isServiceAccount: true,
    firstName: 'Ada', lastName: 'Bot', email: 'ada@agents.example',
    tenant: { name: 'Acme', slug: 'acme', primaryColor: '#111111', secondaryColor: '#222222' },
    userRoles: [
      { role: { name: 'Leadership', rolePermissions: [
        { permission: { module: 'leads', action: 'view' } },
        { permission: { module: 'leads', action: 'edit' } },
      ] } },
    ],
    ...overrides,
  }
}

function setHeader(value: string) {
  headersMock.mockResolvedValue(new Headers({ authorization: value }))
}

describe('getAgentSession resolution', () => {
  beforeEach(() => {
    agentFindUnique.mockReset()
    apiKeyFindUnique.mockReset()
    agentUpdate.mockClear()
    apiKeyUpdate.mockClear()
  })

  it('resolves a valid zhk_ agent key to a session with tenant + permissions', async () => {
    const { key, keyHash } = generateAgentKey()
    setHeader(`Bearer ${key}`)
    agentFindUnique.mockResolvedValue({ id: 'ak1', keyHash, revokedAt: null, user: userRow() })

    const session = await getAgentSession()
    expect(session).not.toBeNull()
    expect(session!.user.tenantId).toBe('t1')
    expect(session!.user.permissions).toContain('leads:view')
    expect(session!.user.permissions).toContain('leads:edit')
    expect(agentUpdate).toHaveBeenCalled() // lastUsedAt touch
  })

  it('rejects a revoked zhk_ key (returns null)', async () => {
    const { key, keyHash } = generateAgentKey()
    setHeader(`Bearer ${key}`)
    agentFindUnique.mockResolvedValue({ id: 'ak1', keyHash, revokedAt: new Date(), user: userRow() })
    apiKeyFindUnique.mockResolvedValue(null)

    expect(await getAgentSession()).toBeNull()
  })

  it('rejects an inactive user even with a valid key', async () => {
    const { key, keyHash } = generateAgentKey()
    setHeader(`Bearer ${key}`)
    agentFindUnique.mockResolvedValue({ id: 'ak1', keyHash, revokedAt: null, user: userRow({ status: 'SUSPENDED' }) })
    apiKeyFindUnique.mockResolvedValue(null)

    expect(await getAgentSession()).toBeNull()
  })

  it('resolves a valid zpk_ public/tenant key (no service-account requirement)', async () => {
    const { key, keyHash } = generateApiKey()
    setHeader(`Bearer ${key}`)
    agentFindUnique.mockResolvedValue(null)
    apiKeyFindUnique.mockResolvedValue({ id: 'pk1', keyHash, revokedAt: null, user: userRow({ isServiceAccount: false }) })

    const session = await getAgentSession()
    expect(session).not.toBeNull()
    expect(session!.user.tenantId).toBe('t1')
    expect(apiKeyUpdate).toHaveBeenCalled()
  })

  it('returns null when there is no key header', async () => {
    headersMock.mockResolvedValue(new Headers({}))
    expect(await getAgentSession()).toBeNull()
  })

  it('returns null for an unknown key (no DB match)', async () => {
    setHeader('Bearer zhk_' + 'a'.repeat(48))
    agentFindUnique.mockResolvedValue(null)
    apiKeyFindUnique.mockResolvedValue(null)
    expect(await getAgentSession()).toBeNull()
  })

  it('generateApiKey mints a zpk_ key with matching hash + prefix', () => {
    const { key, keyHash, keyPrefix } = generateApiKey()
    expect(key.startsWith('zpk_')).toBe(true)
    expect(keyPrefix).toBe(key.slice(0, 12))
    expect(keyHash).toBe(hashKey(key))
  })
})
