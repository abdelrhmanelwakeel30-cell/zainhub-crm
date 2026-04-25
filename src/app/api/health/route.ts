/**
 * Health probe for load balancers / uptime monitors.
 *
 * R-003 (CRM-V3-FULL-AUDIT-2026-04-25.md): the previous version returned 200
 * unconditionally — uptime tools would report "healthy" while Postgres was
 * down. This now actually pings the database with a 2 s timeout and returns
 * 503 + a `degraded` status when the dependency check fails.
 */

import { prisma } from '@/lib/prisma'

const DB_TIMEOUT_MS = 2_000

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ])
}

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}
  let allOk = true

  // Database round-trip
  const dbStart = Date.now()
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, DB_TIMEOUT_MS)
    checks.db = { ok: true, latencyMs: Date.now() - dbStart }
  } catch (err) {
    allOk = false
    checks.db = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : String(err),
    }
  }

  return Response.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  )
}
