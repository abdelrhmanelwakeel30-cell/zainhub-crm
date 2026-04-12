import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPortalToken, extractBearerToken } from '@/lib/portal-auth'
import { prisma as _prisma } from '@/lib/prisma'
import { nextNumber } from '@/lib/number-sequence'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

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

    const changeRequests = await prisma.changeRequest.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { clientUserId: user.id },
          ...(user.companyId ? [{ companyId: user.companyId }] : []),
        ],
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

    const cr = await prisma.changeRequest.create({
      data: {
        tenantId: user.tenantId,
        crNumber,
        title,
        description: description ?? null,
        clientUserId: user.id,
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
