import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'

/**
 * Identity echo for agent (API-key) callers and the CRM MCP server.
 * Returns the resolved session's tenant, roles and permissions so an agent can
 * confirm connectivity and discover exactly what it is allowed to do.
 */
export async function GET() {
  const session = await getApiSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }
  const u = session.user
  return NextResponse.json({
    success: true,
    data: {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email ?? null,
      tenantId: u.tenantId,
      tenantSlug: u.tenantSlug,
      roles: u.roles,
      permissions: u.permissions,
    },
  })
}
