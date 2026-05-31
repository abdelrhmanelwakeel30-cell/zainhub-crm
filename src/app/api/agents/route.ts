import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'

/**
 * AI agent fleet for the in-CRM Agents dashboard. Lists every agent service
 * account (the 166 paperclip agents) with its department, role, API-key status
 * and last-activity, plus summary + per-department breakdown. Tenant-scoped.
 */

type Status = 'active' | 'idle' | 'never' | 'revoked'

export async function GET() {
  const guard = await requireApiPermission('users:view')
  if (!guard.ok) return guard.response
  const { tenantId } = guard.session.user

  try {
    const users = await prisma.user.findMany({
      where: { tenantId, isServiceAccount: true },
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
        agentApiKey: { select: { lastUsedAt: true, revokedAt: true, keyPrefix: true } },
      },
      orderBy: [{ department: 'asc' }, { firstName: 'asc' }],
    })

    const now = Date.now()
    const ACTIVE_WINDOW = 24 * 60 * 60 * 1000

    const agents = users.map((u) => {
      const key = u.agentApiKey
      let status: Status = 'never'
      if (key?.revokedAt) status = 'revoked'
      else if (key?.lastUsedAt) status = now - new Date(key.lastUsedAt).getTime() <= ACTIVE_WINDOW ? 'active' : 'idle'
      return {
        id: u.id,
        agentId: u.agentId,
        name: `${u.firstName} ${u.lastName}`.replace(/\s*\(Agent\)$/, '').trim(),
        department: u.department ?? 'Unassigned',
        role: u.userRoles[0]?.role.name ?? '—',
        status,
        lastUsedAt: key?.lastUsedAt ?? null,
        keyPrefix: key?.keyPrefix ?? null,
      }
    })

    // Per-department breakdown
    const byDeptMap = new Map<string, { department: string; count: number; active: number }>()
    for (const a of agents) {
      const d = byDeptMap.get(a.department) ?? { department: a.department, count: 0, active: 0 }
      d.count += 1
      if (a.status === 'active') d.active += 1
      byDeptMap.set(a.department, d)
    }
    const byDepartment = [...byDeptMap.values()].sort((a, b) => b.count - a.count)

    const summary = {
      total: agents.length,
      departments: byDeptMap.size,
      active: agents.filter((a) => a.status === 'active').length,
      idle: agents.filter((a) => a.status === 'idle').length,
      never: agents.filter((a) => a.status === 'never').length,
      revoked: agents.filter((a) => a.status === 'revoked').length,
    }

    return NextResponse.json({ success: true, data: { agents, byDepartment, summary } })
  } catch (err) {
    log.error('GET /api/agents', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
