import { NextRequest, NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { ZodType } from 'zod'
import { requireApiPermission, getApiSession } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { log } from '@/lib/logger'

/**
 * F-4: Shared API route factory.
 *
 * Wraps the auth → permission → (optional) body-validation → tenant-scope
 * boilerplate that every mutation route repeats, and funnels unhandled errors
 * to a single logged 500. Behaviour is identical to hand-rolled routes:
 *   - 401 when unauthenticated
 *   - 403 when the permission is missing
 *   - 422 when the Zod body fails to parse
 *   - 500 (logged) on any thrown error
 *
 * Usage:
 *   export const POST = withApi(
 *     async ({ tenantId, userId, body }) => NextResponse.json({ ... }, { status: 201 }),
 *     { permission: 'budgeting:create', schema: createSchema, label: 'POST /api/cost-centers' },
 *   )
 */
export interface ApiContext<TBody> {
  req: NextRequest
  session: Session
  tenantId: string
  userId: string
  body: TBody
}

export interface WithApiOptions<TBody> {
  /** RBAC permission string, e.g. 'settings:edit'. Omit for auth-only (any active session). */
  permission?: string
  /** Optional Zod schema; when present the JSON body is parsed into `ctx.body`. */
  schema?: ZodType<TBody>
  /** Label for error logs, e.g. 'POST /api/cost-centers'. */
  label?: string
}

export function withApi<TBody = undefined>(
  handler: (ctx: ApiContext<TBody>) => Promise<Response> | Response,
  options: WithApiOptions<TBody> = {},
) {
  return async (req: NextRequest): Promise<Response> => {
    // Auth + RBAC (browser session OR agent key, via the shared resolvers).
    let resolved: Session
    if (options.permission) {
      const guard = await requireApiPermission(options.permission)
      if (!guard.ok) return guard.response
      resolved = guard.session
    } else {
      const session = await getApiSession()
      if (!session?.user?.tenantId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      resolved = session
    }

    let body = undefined as unknown as TBody
    if (options.schema) {
      const parsed = await parseJson(req, options.schema)
      if (parsed instanceof NextResponse) return parsed
      body = parsed.data
    }

    try {
      return await handler({
        req,
        session: resolved,
        tenantId: resolved.user.tenantId,
        userId: resolved.user.id,
        body,
      })
    } catch (err) {
      log.error(options.label ?? 'withApi handler error', { err })
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
}
