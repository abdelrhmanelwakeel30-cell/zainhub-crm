import { describe, it, expect } from 'vitest'
import {
  normalizeDomain,
  createWebsiteSchema,
  updateWebsiteSchema,
} from '@/lib/validators/website-analysis'

describe('normalizeDomain', () => {
  it('strips protocol, lowercases, and trims', () => {
    expect(normalizeDomain('  HTTPS://Example.com  ')).toBe('example.com')
    expect(normalizeDomain('http://Example.COM')).toBe('example.com')
  })

  it('removes trailing slashes', () => {
    expect(normalizeDomain('example.com/')).toBe('example.com')
    expect(normalizeDomain('https://example.com///')).toBe('example.com')
  })

  it('leaves an already-normalised domain unchanged', () => {
    expect(normalizeDomain('example.com')).toBe('example.com')
  })
})

describe('createWebsiteSchema', () => {
  it('accepts valid input', () => {
    const result = createWebsiteSchema.safeParse({
      name: 'ZainHub',
      domain: 'https://zainhub.ae/',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.domain).toBe('zainhub.ae')
      expect(result.data.type).toBe('CORPORATE') // default
    }
  })

  it('rejects an invalid domain', () => {
    const result = createWebsiteSchema.safeParse({
      name: 'Bad site',
      domain: 'not a domain at all',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a single-label domain (no TLD)', () => {
    const result = createWebsiteSchema.safeParse({
      name: 'Bad',
      domain: 'localhost',
    })
    expect(result.success).toBe(false)
  })

  it('enforces name min length (>=2)', () => {
    const result = createWebsiteSchema.safeParse({
      name: 'A',
      domain: 'example.com',
    })
    expect(result.success).toBe(false)
  })

  it('enforces name max length (<=120)', () => {
    const result = createWebsiteSchema.safeParse({
      name: 'A'.repeat(121),
      domain: 'example.com',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateWebsiteSchema', () => {
  it('accepts a partial update', () => {
    const result = updateWebsiteSchema.safeParse({ name: 'New name' })
    expect(result.success).toBe(true)
  })

  it('accepts a status update', () => {
    const result = updateWebsiteSchema.safeParse({ status: 'ARCHIVED' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid status', () => {
    const result = updateWebsiteSchema.safeParse({ status: 'BOGUS' })
    expect(result.success).toBe(false)
  })
})
