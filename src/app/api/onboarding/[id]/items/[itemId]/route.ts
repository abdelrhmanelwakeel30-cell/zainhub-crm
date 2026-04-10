import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, serverError, notFound, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  completed: z.boolean(),
  notes: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { id, itemId } = await params

    // Verify onboarding belongs to tenant
    const onboarding = await prisma.clientOnboarding.findFirst({
      where: { id, tenantId: session.user.tenantId },
    })
    if (!onboarding) return notFound('Onboarding not found')

    // Verify item belongs to onboarding
    const item = await prisma.clientOnboardingItem.findFirst({
      where: { id: itemId, onboardingId: id },
    })
    if (!item) return notFound('Onboarding item not found')

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
    }

    const updatedItem = await prisma.clientOnboardingItem.update({
      where: { id: itemId },
      data: {
        completedAt: parsed.data.completed ? new Date() : null,
        completedById: parsed.data.completed ? session.user.id : null,
        notes: parsed.data.notes !== undefined ? parsed.data.notes : item.notes,
      },
      include: {
        completedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Check if all required items are now complete — auto-complete the onboarding
    const allItems = await prisma.clientOnboardingItem.findMany({
      where: { onboardingId: id },
    })
    const allRequired = allItems.filter(i => i.isRequired)
    const allRequiredDone = allRequired.every(i => !!i.completedAt || i.id === itemId && parsed.data.completed)

    if (allRequiredDone && onboarding.status === 'IN_PROGRESS') {
      await prisma.clientOnboarding.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      })
    }

    return ok(updatedItem)
  } catch (err) {
    return serverError(err)
  }
}
