import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, serverError, notFound, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { companyId } = await params

    const record = await prisma.accountHealth.findFirst({
      where: { companyId, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
      },
    })

    if (!record) return notFound('Account health record not found')

    return ok(record)
  } catch (err) {
    return serverError(err)
  }
}
