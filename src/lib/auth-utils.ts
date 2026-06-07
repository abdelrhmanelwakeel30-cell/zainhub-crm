import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import { getAgentSession } from '@/lib/agent-auth'
export { hasPermission, hasAnyPermission, hasRole } from '@/lib/permissions'

export async function getSession() {
  const session = await auth()
  return session
}

/**
 * For use in API Route Handlers (returns null instead of redirecting).
 * Always returns null if unauthenticated — caller must return 401.
 */
export async function getApiSession() {
  const session = await auth()
  if (session?.user?.tenantId) return session
  // Fall back to AI-agent API-key auth (paperclip platform / CRM MCP server).
  const agent = await getAgentSession()
  if (agent?.user?.tenantId) return agent
  return null
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

export async function requirePermission(permission: string) {
  const session = await requireAuth()
  if (!hasPermission(session.user.permissions, permission)) {
    redirect('/unauthorized')
  }
  return session
}

/**
 * API-route variant of requirePermission. Returns:
 *   - { ok: false, response } — caller returns `response` immediately (401 or 403 JSON)
 *   - { ok: true, session }   — caller proceeds with authorized session
 *
 * Use in every mutation (POST/PATCH/DELETE) route.
 *
 * Example:
 *   const guard = await requireApiPermission('invoices:edit')
 *   if (!guard.ok) return guard.response
 *   const { session } = guard
 */
export async function requireApiPermission(permission: string) {
  // Accept either a browser session OR an AI-agent API key (paperclip / MCP).
  const session = (await auth()) ?? (await getAgentSession())
  if (!session?.user?.tenantId) {
    return {
      ok: false as const,
      response: new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    }
  }
  if (!hasPermission(session.user.permissions, permission)) {
    return {
      ok: false as const,
      response: new Response(
        JSON.stringify({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED', required: permission }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      ),
    }
  }
  return { ok: true as const, session }
}

