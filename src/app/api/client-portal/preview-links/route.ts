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
      select: { companyId: true, tenantId: true },
    })

    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const { companyId, tenantId } = clientUser

    const previewLinks = await prisma.previewLink.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        ...(companyId ? { sharedWithCompanyId: companyId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sharedByUser: { select: { firstName: true, lastName: true } },
        project: { select: { name: true } },
        clientService: { select: { serviceName: true } },
      },
    })

    return NextResponse.json({ success: true, data: previewLinks })
  } catch (err) {
    console.error('[client-portal/preview-links]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
