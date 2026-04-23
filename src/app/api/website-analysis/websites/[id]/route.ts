import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { updateWebsiteSchema } from '@/lib/validators/website-analysis'

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const website = await prisma.website.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      ownerUser: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      integrations: true,
    },
  })
  if (!website) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: website })
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:edit')
  if (!guard.ok) return guard.response
  const { session } = guard
  const { id } = await ctx.params

  try {
    const existing = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateWebsiteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const data = parsed.data
    const updated = await prisma.website.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.domain !== undefined && { domain: data.domain }),
        ...(data.brand !== undefined && { brand: data.brand || null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.primaryMarket !== undefined && { primaryMarket: data.primaryMarket || null }),
        ...(data.primaryLanguage !== undefined && { primaryLanguage: data.primaryLanguage || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.ownerUserId !== undefined && { ownerUserId: data.ownerUserId || null }),
        ...(data.status !== undefined && { status: data.status }),
      },
    })

    await createAuditLog({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'Website',
      entityId: updated.id,
      entityName: updated.name,
      beforeValue: existing as unknown as Record<string, unknown>,
      afterValue: updated as unknown as Record<string, unknown>,
      sourceModule: 'website-analysis',
      req,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('PATCH /api/website-analysis/websites/[id]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guard = await requireApiPermission('website_analysis:delete')
  if (!guard.ok) return guard.response
  const { session } = guard
  const { id } = await ctx.params

  const existing = await prisma.website.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  // Soft-delete (spec §15 Q1) — default is archive, not destroy
  const updated = await prisma.website.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  await createAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: 'ARCHIVE',
    entityType: 'Website',
    entityId: updated.id,
    entityName: updated.name,
    beforeValue: existing as unknown as Record<string, unknown>,
    afterValue: updated as unknown as Record<string, unknown>,
    sourceModule: 'website-analysis',
    req,
  })

  return NextResponse.json({ success: true })
}
