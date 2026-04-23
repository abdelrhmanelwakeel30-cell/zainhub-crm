import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { neonConfig } from '@neondatabase/serverless'
import type { PrismaClient as PrismaClientType } from '.prisma/client'

// F-008: Enable Neon connection caching so the HTTP fetch layer reuses
// keep-alive connections across requests within the same warm function
// instance. Combined with globalThis.__prisma caching below, this
// significantly reduces cold-start overhead and TTFB on Vercel.
neonConfig.fetchConnectionCache = true

// Ensure Prisma Decimal fields serialize as JS numbers (not strings) in JSON responses.
// This patches the prototype once at module load so ALL routes benefit automatically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber()
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined
}

function createPrismaClient(): PrismaClientType {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined')
  }
  const log: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  // Use Neon serverless adapter for Neon-hosted databases (production/staging).
  // Fall back to plain PrismaClient for local PostgreSQL (direct pg driver).
  if (process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('neon.database')) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    return new PrismaClient({ adapter, log }) as unknown as PrismaClientType
  }
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter, log }) as unknown as PrismaClientType
}

// Cache the client on globalThis for ALL environments. On Vercel/Next.js the
// same Node process can be reused across requests (route handlers, ISR,
// background tasks), so re-creating a Neon-backed Prisma client per request
// would exhaust connection pools. globalThis survives module re-evaluation
// within a single instance but is scoped per serverless function instance,
// which is exactly what we want.
export const prisma: PrismaClientType =
  globalThis.__prisma ?? createPrismaClient()

globalThis.__prisma = prisma
