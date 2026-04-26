import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const bundle = await prisma.serviceBundle.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            service: { select: { id: true, name: true, category: true } },
            package: { select: { id: true, name: true, price: true } },
          },
        },
      },
    })
    if (!bundle) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: bundle })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('bundles:edit')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const existing = await prisma.serviceBundle.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const bundle = await prisma.serviceBundle.update({
      where: { id },
      data: parsed.data,
      include: {
        items: {
          include: {
            service: { select: { id: true, name: true } },
            package: { select: { id: true, name: true, price: true } },
          },
        },
      },
    })
    return NextResponse.json({ success: true, data: bundle })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('bundles:delete')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await prisma.serviceBundle.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.serviceBundle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
