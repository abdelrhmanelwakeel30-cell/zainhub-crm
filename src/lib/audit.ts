import { prisma as _prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'CONVERT'
  | 'ASSIGN'
  | 'ARCHIVE'
  | 'RESTORE'

interface CreateAuditLogParams {
  tenantId: string
  userId?: string
  action: AuditActionType
  entityType: string
  entityId: string
  entityName?: string
  changes?: Record<string, { old: unknown; new: unknown }>
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
  req?: Request
  sourceModule?: string
}

export async function createAuditLog({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  entityName,
  changes,
  beforeValue,
  afterValue,
  req,
  sourceModule,
}: CreateAuditLogParams) {
  let ipAddress: string | undefined
  let userAgent: string | undefined

  if (req) {
    const headers = req.headers
    const forwarded = headers.get('x-forwarded-for')
    const realIp = headers.get('x-real-ip')
    ipAddress = forwarded ? forwarded.split(',')[0].trim() : (realIp ?? undefined)
    userAgent = headers.get('user-agent') ?? undefined
  }

  return prisma.auditLog.create({
    data: {
      tenantId,
      userId: userId ?? null,
      action,
      entityType,
      entityId,
      entityName: entityName ?? null,
      changes: changes ?? undefined,
      beforeValue: beforeValue ?? undefined,
      afterValue: afterValue ?? undefined,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      sourceModule: sourceModule ?? null,
    },
  })
}
