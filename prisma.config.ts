import path from 'node:path'
import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    // Prisma 7: only `url` is supported. Prefer DIRECT_URL (non-pooled) for migrations
    // to avoid Neon HTTP-pooler deadlocks; runtime traffic uses the adapter
    // (@prisma/adapter-neon) which handles its own pooling.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
})
