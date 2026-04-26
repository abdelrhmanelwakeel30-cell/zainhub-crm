import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const addItemSchema = z.object({
  serviceId: z.string().optional(),
  packageId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const bundle = await prisma.serviceBundle.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!bundle) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const items = await prisma.serviceBundleItem.findMany({
      where: { bundleId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        service: { select: { id: true, name: true, category: true } },
        package: { select: { id: true, name: true, price: true } },
      },
    })
    return NextResponse.json({ success: true, data: items })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('bundles:create')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = addItemSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const bundle = await prisma.serviceBundle.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!bundle) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const item = await prisma.serviceBundleItem.create({
      data: {
        bundleId: id,
        serviceId: parsed.data.serviceId || null,
        packageId: parsed.data.packageId || null,
        quantity: parsed.data.quantity,
        discount: parsed.data.discount ?? null,
        notes: parsed.data.notes || null,
        sortOrder: parsed.data.sortOrder,
      },
      include: {
        service: { select: { id: true, name: true, category: true } },
        package: { select: { id: true, name: true, price: true } },
      },
    })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
