import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') || '20'))

  try {
    const form = await prisma.leadCaptureForm.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!form) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const [data, total] = await Promise.all([
      prisma.leadCaptureSubmission.findMany({
        where: { formId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          lead: { select: { id: true, fullName: true, leadNumber: true } },
        },
      }),
      prisma.leadCaptureSubmission.count({ where: { formId: id } }),
    ])

    return NextResponse.json({ success: true, data, total, page, pageSize })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
