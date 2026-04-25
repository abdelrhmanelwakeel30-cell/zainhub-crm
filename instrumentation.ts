/**
 * Next.js instrumentation hook — registers Sentry per-runtime.
 *
 * Closes R-002. No-op when SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN is unset.
 */

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

/**
 * Forward route-handler errors (RSC + route.ts) to Sentry.
 * `captureRequestError` is the v8+ replacement for `onRequestError`.
 */
export const onRequestError = Sentry.captureRequestError
