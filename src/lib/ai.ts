import 'server-only'
import { log } from '@/lib/logger'

/**
 * Key-gated text generation (Phase D AI). When ANTHROPIC_API_KEY is set, calls
 * Claude with prompt caching on the system block. Otherwise (or on any error)
 * returns a deterministic template so the app stays fully functional — and the
 * build/tests never depend on a key.
 */
export interface GenerateOpts {
  system: string
  prompt: string
  maxTokens?: number
  /** Used to build the deterministic fallback when no key/AI is available. */
  fallback?: string
}

export type AiSource = 'ai' | 'template'

export function aiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

export async function generateText(opts: GenerateOpts): Promise<{ text: string; source: AiSource }> {
  const key = process.env.ANTHROPIC_API_KEY
  if (key) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: key })
      const msg = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest',
        max_tokens: opts.maxTokens ?? 1024,
        system: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: opts.prompt }],
      })
      const text = msg.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('\n')
        .trim()
      if (text) return { text, source: 'ai' }
    } catch (err) {
      log.warn('[ai] generation failed; using template fallback', { err })
    }
  }
  return { text: opts.fallback ?? opts.prompt, source: 'template' }
}
