import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPortalToken, extractBearerToken } from '@/lib/portal-auth'
import { prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
const CreateCRSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  clientServiceId: z.string().optional(),
})

async function getPortalUser(token: string) {
  const payload = await verifyPortalToken(token)
  if (!payload) return null

  const user = await prisma.clientPortalUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, companyId: true, tenantId: true },
  })
  return user
}

export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = await getPortalUser(token)
    if (!user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    // Q-001 fix: ChangeRequest has no clientUserId field on the model — we
    // scope visibility by the portal user's companyId (the user's organisation).
    // Without a companyId, the user sees nothing.
    const changeRequests = await prisma.changeRequest.findMany({
      where: {
        tenantId: user.tenantId,
        ...(user.companyId
          ? { companyId: user.companyId }
          : { id: '__no_company_no_results__' }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        crNumber: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        type: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: changeRequests })
  } catch (err) {
    console.error('[client-portal/change-requests GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req.headers.get('authorization'))
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = await getPortalUser(token)
    if (!user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateCRSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { title, description, clientServiceId } = parsed.data

    const crNumber = await nextNumber(user.tenantId, 'changeRequest')

    // Q-001 fix: ChangeRequest has no clientUserId field. Provenance is captured
    // via companyId (the portal user's org). When we wire a real "submitted by
    // portal user" relation, add it to the schema first.
    const cr = await prisma.changeRequest.create({
      data: {
        tenantId: user.tenantId,
        crNumber,
        title,
        description: description ?? null,
        companyId: user.companyId ?? null,
        clientServiceId: clientServiceId ?? null,
        status: 'SUBMITTED',
        priority: 'MEDIUM',
        type: 'OTHER',
      },
    })

    return NextResponse.json({ success: true, data: cr }, { status: 201 })
  } catch (err) {
    console.error('[client-portal/change-requests POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
