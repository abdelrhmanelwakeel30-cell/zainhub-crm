import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken, extractBearerToken } from '@/lib/portal-auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyPortalToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const clientUser = await prisma.clientPortalUser.findUnique({
      where: { id: payload.sub },
      select: { companyId: true, contactId: true, tenantId: true },
    })

    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const { companyId, tenantId } = clientUser

    const services = await prisma.clientService.findMany({
      where: {
        tenantId,
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        milestones: { select: { status: true } },
        teamMembers: {
          select: {
            id: true,
            role: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: services })
  } catch (err) {
    log.error('[client-portal/services]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
