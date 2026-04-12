import { prisma } from '@/lib/prisma'

/**
 * Atomic per-tenant, per-entity number generator.
 *
 * Previously the codebase used `prisma.X.count({ where: { tenantId } }) + 1`
 * to mint document numbers. That has two race conditions:
 *   1. Two concurrent inserts both read the same count and mint the same
 *      number — the unique constraint on (tenantId, entityNumber) rejects
 *      the second one with a 500.
 *   2. Deleting a row lowers the count and the next insert reuses an
 *      already-retired number.
 *
 * `nextNumber` upserts a `NumberSequence` row per (tenantId, entityType)
 * and returns the new value atomically using Postgres' row-level lock
 * inside a single update statement.
 */
export interface NextNumberOptions {
  prefix?: string
  padLength?: number
}

const DEFAULT_PREFIXES: Record<string, string> = {
  lead: 'LD',
  contact: 'CON',
  company: 'COM',
  opportunity: 'OPP',
  quotation: 'QUO',
  proposal: 'PRP',
  contract: 'CTR',
  invoice: 'INV',
  payment: 'PAY',
  expense: 'EXP',
  project: 'PRJ',
  task: 'TSK',
  ticket: 'TKT',
  changeRequest: 'CR',
  clientService: 'SVC',
  subscription: 'SUB',
  deliverable: 'DEL',
  campaign: 'CMP',
  form: 'FRM',
}

/**
 * Get the next formatted number for a given (tenant, entityType).
 *
 * Uses Prisma's `upsert` which compiles to a single transaction on
 * Postgres and holds a row-level lock on the unique constraint, which
 * gives us linearizable increments across concurrent inserts.
 */
export async function nextNumber(
  tenantId: string,
  entityType: string,
  opts: NextNumberOptions = {},
): Promise<string> {
  const prefix = opts.prefix ?? DEFAULT_PREFIXES[entityType] ?? entityType.slice(0, 3).toUpperCase()
  const padLength = opts.padLength ?? 4

  // `update` with `increment` is atomic in Postgres. We use upsert so the
  // first call for a given (tenant, entityType) creates the row.
  const seq = await prisma.numberSequence.upsert({
    where: { tenantId_entityType: { tenantId, entityType } },
    update: { lastNumber: { increment: 1 } },
    create: {
      tenantId,
      entityType,
      lastNumber: 1,
      prefix,
      padLength,
    },
  })

  return `${prefix}-${String(seq.lastNumber).padStart(padLength, '0')}`
}

/**
 * Peek at the next number without incrementing. Used for UI previews.
 */
export async function peekNextNumber(
  tenantId: string,
  entityType: string,
  opts: NextNumberOptions = {},
): Promise<string> {
  const prefix = opts.prefix ?? DEFAULT_PREFIXES[entityType] ?? entityType.slice(0, 3).toUpperCase()
  const padLength = opts.padLength ?? 4
  const seq = await prisma.numberSequence.findUnique({
    where: { tenantId_entityType: { tenantId, entityType } },
  })
  const next = (seq?.lastNumber ?? 0) + 1
  return `${prefix}-${String(next).padStart(padLength, '0')}`
}
