import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, unauthorized, serverError, ok, parseJson } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { PipelineEntityType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const entityType = (searchParams.get('entityType') || searchParams.get('type') || '') as PipelineEntityType | ''

    const pipelines = await prisma.pipeline.findMany({
      where: {
        tenantId: session.user.tenantId,
        isActive: true,
        ...(entityType && { entityType: entityType as PipelineEntityType }),
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          select: {
            id: true, name: true, nameAr: true, order: true, color: true,
            probability: true, isClosed: true, isWon: true,
          },
        },
      },
      orderBy: { isDefault: 'desc' },
    })

    return ok(pipelines)
  } catch (err) {
    return serverError(err)
  }
}

const StageSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().nullable(),
  order: z.number().int().optional(),
  color: z.string().optional().nullable(),
  probability: z.number().int().min(0).max(100).optional(),
  isClosed: z.boolean().optional(),
  isWon: z.boolean().optional(),
})

const CreatePipelineSchema = z.object({
  name: z.string().min(1).max(255),
  nameAr: z.string().max(255).optional().nullable(),
  entityType: z.enum(['LEAD', 'OPPORTUNITY']),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stages: z.array(StageSchema).min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()

    const parsed = await parseJson(req, CreatePipelineSchema)
    if (parsed instanceof NextResponse) return parsed

    const tenantId = session.user.tenantId

    const pipeline = await prisma.$transaction(async (tx) => {
      // Ensure only one default per entityType
      if (parsed.data.isDefault) {
        await tx.pipeline.updateMany({
          where: { tenantId, entityType: parsed.data.entityType, isDefault: true },
          data: { isDefault: false },
        })
      }

      const p = await tx.pipeline.create({
        data: {
          tenantId,
          name: parsed.data.name,
          nameAr: parsed.data.nameAr || null,
          entityType: parsed.data.entityType,
          isDefault: parsed.data.isDefault ?? false,
          isActive: parsed.data.isActive ?? true,
        },
      })

      await tx.pipelineStage.createMany({
        data: parsed.data.stages.map((s, i) => ({
          pipelineId: p.id,
          name: s.name,
          nameAr: s.nameAr || null,
          order: s.order ?? i,
          color: s.color ?? undefined,
          probability: s.probability ?? 0,
          isClosed: s.isClosed ?? false,
          isWon: s.isWon ?? false,
        })),
      })

      return p
    })

    await createAuditLog({
      tenantId,
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'pipeline',
      entityId: pipeline.id,
      entityName: pipeline.name,
      sourceModule: 'pipelines',
      req,
    })

    return NextResponse.json({ success: true, data: pipeline }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
