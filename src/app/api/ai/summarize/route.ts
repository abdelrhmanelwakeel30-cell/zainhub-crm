import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, hasPermission } from '@/lib/auth-utils'
import { parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { generateText } from '@/lib/ai'
import { log } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({ entityType: z.string().min(1).max(40), entityId: z.string().min(1) })

const SYSTEM = 'You summarize a CRM/ERP record\'s recent activity for a busy manager. Output 2-4 crisp bullet points, no preamble.'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJson(req, schema)
  if (parsed instanceof NextResponse) return parsed
  const { entityType, entityId } = parsed.data
  const { tenantId, permissions } = session.user

  // Require view permission on the module named by entityType (best-effort).
  if (!hasPermission(permissions, `${entityType}s:view`) && !hasPermission(permissions, `${entityType}:view`) && !hasPermission(permissions, 'reports:view')) {
    return NextResponse.json({ success: false, error: 'Forbidden', code: 'PERMISSION_DENIED' }, { status: 403 })
  }

  try {
    const entries = await prisma.auditLog.findMany({
      where: { tenantId, entityType, entityId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    if (entries.length === 0) {
      return NextResponse.json({ success: true, data: { summary: 'No recorded activity yet.', source: 'template' } })
    }

    const lines = entries.map((e) => `- ${e.createdAt.toISOString().slice(0, 10)} ${e.action} by ${e.user ? `${e.user.firstName} ${e.user.lastName}` : 'system'}: ${e.entityName ?? ''}`)
    const fallback = `Recent activity (${entries.length} events):\n${lines.slice(0, 6).join('\n')}`

    const { text, source } = await generateText({
      system: SYSTEM,
      prompt: `Summarize this ${entityType} activity timeline:\n${lines.join('\n')}`,
      fallback,
      maxTokens: 400,
    })
    return NextResponse.json({ success: true, data: { summary: text, source, events: entries.length } })
  } catch (err) {
    log.error('POST /api/ai/summarize', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
