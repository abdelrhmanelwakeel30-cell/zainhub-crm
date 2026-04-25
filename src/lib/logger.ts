/**
 * Structured logger with Sentry integration.
 *
 * Closes Q-003 / R-007: replaces ad-hoc `console.error` calls with a single
 * primitive that:
 *   - emits structured JSON in production (one line per event, parseable)
 *   - falls back to pretty console output in development
 *   - forwards errors to Sentry when a DSN is configured (R-002)
 *   - carries `tenantId`, `userId`, `route`, `requestId` when given
 *
 * Usage:
 *   import { log } from '@/lib/logger'
 *   log.error('payment failed', { paymentId, err })
 *   log.warn('rate limit hit', { email })
 *   log.info('webhook received', { event })
 *
 * Migrating an existing site:
 *   - `console.error('foo', err)` → `log.error('foo', { err })`
 *   - `console.warn('bar')` → `log.warn('bar')`
 */

import pino from 'pino'
import * as Sentry from '@sentry/nextjs'

const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

const base = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  // In dev, pretty-print to terminal. In prod (and test), emit raw JSON.
  ...(!isProd && !isTest
    ? {
        transport: {
          target: 'pino/file',
          options: { destination: 1 }, // stdout, no pretty-print to keep deps slim
        },
      }
    : {}),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      '*.password',
      '*.passwordHash',
      '*.token',
      'authorization',
      'cookie',
      '*.authorization',
      '*.cookie',
    ],
    censor: '[REDACTED]',
  },
})

type Ctx = Record<string, unknown>

function captureError(msg: string, ctx?: Ctx) {
  if (!ctx) return
  const err = ctx.err ?? ctx.error
  if (err instanceof Error) {
    // Forward to Sentry; SDK no-ops when DSN is unset.
    Sentry.captureException(err, {
      tags: {
        route: typeof ctx.route === 'string' ? ctx.route : undefined,
        tenantId: typeof ctx.tenantId === 'string' ? ctx.tenantId : undefined,
        userId: typeof ctx.userId === 'string' ? ctx.userId : undefined,
      } as Record<string, string | undefined>,
      extra: { msg, ...ctx },
    })
  }
}

export const log = {
  debug: (msg: string, ctx?: Ctx) => base.debug(ctx ?? {}, msg),
  info: (msg: string, ctx?: Ctx) => base.info(ctx ?? {}, msg),
  warn: (msg: string, ctx?: Ctx) => base.warn(ctx ?? {}, msg),
  error: (msg: string, ctx?: Ctx) => {
    base.error(ctx ?? {}, msg)
    captureError(msg, ctx)
  },
  /** Adds a Sentry breadcrumb without emitting a log line — useful inside hot paths. */
  breadcrumb: (msg: string, ctx?: Ctx) => {
    Sentry.addBreadcrumb({ message: msg, data: ctx, level: 'info' })
  },
}
