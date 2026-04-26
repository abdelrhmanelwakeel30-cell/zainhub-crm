import { NextRequest, NextResponse } from 'next/server'
import { getApiSession, requireApiPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'email', 'phone', 'textarea', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
  sourceTag: z.string().optional(),
  assignToId: z.string().optional(),
  isActive: z.boolean().optional(),
  redirectUrl: z.string().optional(),
  thankYouMsg: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const form = await prisma.leadCaptureForm.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        assignTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
    })
    if (!form) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: form })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('forms:edit')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    const existing = await prisma.leadCaptureForm.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.fields !== undefined) updateData.fields = JSON.stringify(parsed.data.fields)
    if (parsed.data.sourceTag !== undefined) updateData.sourceTag = parsed.data.sourceTag
    if (parsed.data.assignToId !== undefined) updateData.assignToId = parsed.data.assignToId
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive
    if (parsed.data.redirectUrl !== undefined) updateData.redirectUrl = parsed.data.redirectUrl
    if (parsed.data.thankYouMsg !== undefined) updateData.thankYouMsg = parsed.data.thankYouMsg

    const form = await prisma.leadCaptureForm.update({
      where: { id },
      data: updateData,
      include: {
        assignTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { submissions: true } },
      },
    })
    return NextResponse.json({ success: true, data: form })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  // S-004: RBAC gate
  const __guard = await requireApiPermission('forms:delete')
  if (!__guard.ok) return __guard.response
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const existing = await prisma.leadCaptureForm.findFirst({ where: { id, tenantId: session.user.tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    await prisma.leadCaptureForm.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    log.error('error', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
