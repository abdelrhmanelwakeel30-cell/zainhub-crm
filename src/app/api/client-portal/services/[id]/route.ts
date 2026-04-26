import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken, extractBearerToken } from '@/lib/portal-auth'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(req.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyPortalToken(token)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    const { id } = await params

    const clientUser = await prisma.clientPortalUser.findUnique({
      where: { id: payload.sub },
      select: { companyId: true, tenantId: true },
    })

    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const service = await prisma.clientService.findFirst({
      where: {
        id,
        tenantId: clientUser.tenantId,
        ...(clientUser.companyId ? { companyId: clientUser.companyId } : {}),
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        milestones: { orderBy: { order: 'asc' } },
        teamMembers: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        deliverables: {
          select: { id: true, name: true, type: true, visibility: true, fileName: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: service })
  } catch (err) {
    log.error('[client-portal/services/[id]]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
