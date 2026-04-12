import { prisma as _prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

type ActivityTypeValue =
  | 'NOTE'
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'TASK_COMPLETED'
  | 'STATUS_CHANGE'
  | 'STAGE_CHANGE'
  | 'DOCUMENT_UPLOADED'
  | 'COMMENT'
  | 'CONVERSION'
  | 'ASSIGNMENT'
  | 'SYSTEM'

interface CreateActivityParams {
  tenantId: string
  type: ActivityTypeValue
  entityType: string
  entityId: string
  title: string
  description?: string | null
  metadata?: Record<string, unknown>
  performedById?: string | null
}

/**
 * Fire-and-forget activity logger. Writes to the Activity timeline
 * without blocking the caller. Errors are swallowed to avoid
 * breaking the main mutation.
 */
export function createActivity(params: CreateActivityParams): void {
  prisma.activity
    .create({
      data: {
        tenantId: params.tenantId,
        type: params.type,
        entityType: params.entityType,
        entityId: params.entityId,
        title: params.title,
        description: params.description ?? null,
        metadata: params.metadata ?? undefined,
        performedById: params.performedById ?? null,
      },
    })
    .catch((err: Error) => {
      console.error('[Activity] Failed to log activity:', err.message)
    })
}

/**
 * Convenience for common activity patterns
 */
export function logCreate(tenantId: string, entityType: string, entityId: string, entityName: string, userId?: string) {
  createActivity({
    tenantId,
    type: 'SYSTEM',
    entityType,
    entityId,
    title: `${entityType} created: ${entityName}`,
    performedById: userId,
  })
}

export function logUpdate(tenantId: string, entityType: string, entityId: string, entityName: string, userId?: string) {
  createActivity({
    tenantId,
    type: 'SYSTEM',
    entityType,
    entityId,
    title: `${entityType} updated: ${entityName}`,
    performedById: userId,
  })
}

export function logStatusChange(tenantId: string, entityType: string, entityId: string, entityName: string, from: string, to: string, userId?: string) {
  createActivity({
    tenantId,
    type: 'STATUS_CHANGE',
    entityType,
    entityId,
    title: `${entityType} "${entityName}" status changed: ${from} → ${to}`,
    metadata: { fromStatus: from, toStatus: to },
    performedById: userId,
  })
}

export function logStageChange(tenantId: string, entityType: string, entityId: string, entityName: string, from: string, to: string, userId?: string) {
  createActivity({
    tenantId,
    type: 'STAGE_CHANGE',
    entityType,
    entityId,
    title: `${entityType} "${entityName}" moved: ${from} → ${to}`,
    metadata: { fromStage: from, toStage: to },
    performedById: userId,
  })
}

export function logAssignment(tenantId: string, entityType: string, entityId: string, entityName: string, assigneeName: string, userId?: string) {
  createActivity({
    tenantId,
    type: 'ASSIGNMENT',
    entityType,
    entityId,
    title: `${entityType} "${entityName}" assigned to ${assigneeName}`,
    performedById: userId,
  })
}
