/**
 * Sentry — Node runtime init (server components, route handlers, server actions).
 *
 * Closes R-002 / Fix-006. No-op when SENTRY_DSN is unset.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Strip PII server-side too.
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies
    if (event.request?.headers) {
      delete event.request.headers['cookie']
      delete event.request.headers['authorization']
    }
    return event
  },
})
