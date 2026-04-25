/**
 * Sentry — browser-side init.
 *
 * Closes R-002 / Fix-006 from CRM-V3-FULL-AUDIT-2026-04-25.md.
 *
 * The SDK is a no-op when NEXT_PUBLIC_SENTRY_DSN is unset, so this is safe
 * to ship without an account. Set the DSN in Vercel env vars to enable.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),

  // Sample 10% of normal traffic in production, 100% in dev.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay — only enable when explicitly requested via env var.
  replaysSessionSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAY === '1' ? 0.1 : 0,
  replaysOnErrorSampleRate: process.env.NEXT_PUBLIC_SENTRY_REPLAY === '1' ? 1.0 : 0,

  // Environment + release tags — Vercel injects these automatically.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // PII filter (S-013 territory): strip tokens / cookies / passwords from events.
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies
    if (event.request?.headers) {
      delete event.request.headers['cookie']
      delete event.request.headers['authorization']
    }
    return event
  },

  // Reduce noise from third-party scripts and dev HMR.
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
  ],
})
