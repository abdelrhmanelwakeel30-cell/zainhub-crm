import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const decideSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'SKIPPED']),
  comments: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> },
) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id, stepId } = await params

  try {
    const body = await req.json()
    const parsed = decideSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })

    // Verify the approval request belongs to this tenant
    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: { id, tenantId: session.user.tenantId },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })
    if (!approvalRequest) {
      return NextResponse.json({ success: false, error: 'Approval request not found' }, { status: 404 })
    }

    const step = approvalRequest.steps.find((s: { id: string }) => s.id === stepId)
    if (!step) {
      return NextResponse.json({ success: false, error: 'Step not found' }, { status: 404 })
    }
    if (step.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Step is not pending' }, { status: 400 })
    }

    const { decision, comments } = parsed.data

    // Update the step
    await prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: decision,
        comments: comments || null,
        decidedAt: new Date(),
      },
    })

    // Determine new request state
    let newRequestStatus = approvalRequest.status
    let newCurrentStep = approvalRequest.currentStep
    let completedAt: Date | null = null

    if (decision === 'REJECTED') {
      // Any rejection fails the entire request
      newRequestStatus = 'REJECTED'
      completedAt = new Date()
    } else if (decision === 'APPROVED' || decision === 'SKIPPED') {
      const isLastStep = step.stepNumber >= approvalRequest.totalSteps
      if (isLastStep) {
        newRequestStatus = 'APPROVED'
        completedAt = new Date()
      } else {
        // Advance to next step
        newCurrentStep = step.stepNumber + 1
        newRequestStatus = 'IN_PROGRESS'
      }
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: newRequestStatus,
        currentStep: newCurrentStep,
        ...(completedAt ? { completedAt } : {}),
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        steps: {
          include: {
            approver: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { stepNumber: 'asc' },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'approval_step',
        entityId: stepId,
        entityName: `Step ${step.stepNumber} — ${decision}`,
      },
    })

    return NextResponse.json({ success: true, data: updatedRequest })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
