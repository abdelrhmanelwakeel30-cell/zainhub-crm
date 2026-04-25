import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalToken, extractBearerToken } from '@/lib/portal-auth'
import { prisma } from '@/lib/prisma'
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

    const { companyId, contactId, tenantId } = clientUser

    // Build shared where conditions
    const companyFilter = companyId ? { companyId } : {}
    const tenantFilter = { tenantId }

    const [activeServices, openChangeRequests, pendingApprovals, openTickets, recentCRs, recentServices] =
      await Promise.all([
        prisma.clientService.count({
          where: { ...tenantFilter, ...companyFilter, status: 'ACTIVE' },
        }),
        prisma.changeRequest.count({
          where: {
            ...tenantFilter,
            ...companyFilter,
            status: { notIn: ['COMPLETED', 'REJECTED', 'CANCELLED'] },
          },
        }),
        prisma.approvalStep.count({
          where: {
            // T-003 (CRM-V3-FULL-AUDIT-2026-04-25.md): defense-in-depth — scope by tenant
            // even though approverClientUserId is unique to one tenant today.
            ...tenantFilter,
            approverClientUserId: payload.sub,
            status: 'PENDING',
          },
        }),
        prisma.ticket.count({
          where: {
            ...tenantFilter,
            ...(companyId ? { clientId: companyId } : {}),
            status: { in: ['NEW', 'OPEN', 'IN_PROGRESS'] },
          },
        }).catch(() => 0),
        prisma.changeRequest.findMany({
          where: { ...tenantFilter, ...companyFilter },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, crNumber: true, title: true, status: true, createdAt: true },
        }),
        prisma.clientService.findMany({
          where: { ...tenantFilter, ...companyFilter },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            clientServiceNumber: true,
            serviceName: true,
            status: true,
            createdAt: true,
          },
        }),
      ])

    // Merge recent activity
    const recentActivity = [
      ...recentCRs.map((cr: { id: string; crNumber: string; title: string; status: string; createdAt: Date }) => ({
        id: cr.id,
        type: 'Change Request',
        title: `${cr.crNumber}: ${cr.title}`,
        status: cr.status,
        createdAt: cr.createdAt.toISOString(),
      })),
      ...recentServices.map((svc: { id: string; clientServiceNumber: string; serviceName: string; status: string; createdAt: Date }) => ({
        id: svc.id,
        type: 'Service',
        title: `${svc.clientServiceNumber}: ${svc.serviceName}`,
        status: svc.status,
        createdAt: svc.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    return NextResponse.json({
      success: true,
      data: {
        activeServices,
        openChangeRequests,
        pendingApprovals,
        openTickets,
        recentActivity,
      },
    })
  } catch (err) {
    console.error('[client-portal/dashboard]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
