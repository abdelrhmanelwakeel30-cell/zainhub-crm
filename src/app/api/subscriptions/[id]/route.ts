import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED']).optional(),
  amount: z.number().min(0).optional(),
  nextBillingDate: z.string().optional(),
  notes: z.string().optional(),
  autoRenew: z.boolean().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        company: { select: { id: true, displayName: true } },
        service: { select: { id: true, name: true } },
        package: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        billingHistory: {
          orderBy: { billingDate: 'desc' },
          include: {
            invoice: { select: { id: true, invoiceNumber: true, status: true } },
          },
        },
      },
    })
    if (!subscription) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: subscription })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const existing = await prisma.subscription.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status
      if (parsed.data.status === 'CANCELLED') {
        updateData.endDate = new Date()
      }
    }
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount
    if (parsed.data.nextBillingDate !== undefined) updateData.nextBillingDate = new Date(parsed.data.nextBillingDate)
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
    if (parsed.data.autoRenew !== undefined) updateData.autoRenew = parsed.data.autoRenew
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        company: { select: { id: true, displayName: true } },
        service: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'subscription',
        entityId: subscription.id,
        entityName: subscription.name,
      },
    })

    return NextResponse.json({ success: true, data: subscription })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await prisma.subscription.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    await prisma.subscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
