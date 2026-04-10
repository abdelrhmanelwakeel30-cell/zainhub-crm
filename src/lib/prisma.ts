import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import type { PrismaClient as PrismaClientType } from '.prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClientType | undefined
}

function createPrismaClient(): PrismaClientType {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter }) as unknown as PrismaClientType
}

export const prisma: PrismaClientType =
  globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
