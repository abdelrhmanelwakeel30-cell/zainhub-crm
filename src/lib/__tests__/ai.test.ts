import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { generateText, aiEnabled } from '@/lib/ai'

describe('ai.generateText (no key → deterministic fallback)', () => {
  const prev = process.env.ANTHROPIC_API_KEY
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY })
  afterEach(() => { if (prev) process.env.ANTHROPIC_API_KEY = prev })

  it('reports disabled without a key', () => {
    expect(aiEnabled()).toBe(false)
  })

  it('returns the fallback text with source=template when no key', async () => {
    const r = await generateText({ system: 'sys', prompt: 'p', fallback: 'FALLBACK BODY' })
    expect(r.source).toBe('template')
    expect(r.text).toBe('FALLBACK BODY')
  })

  it('falls back to the prompt when no explicit fallback given', async () => {
    const r = await generateText({ system: 'sys', prompt: 'the prompt' })
    expect(r.source).toBe('template')
    expect(r.text).toBe('the prompt')
  })
})
