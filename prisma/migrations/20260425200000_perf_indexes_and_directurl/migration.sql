-- ============================================================================
-- Migration: perf_indexes_and_directurl
-- Generated: 2026-04-25
--
-- Performance composite indexes for common query patterns:
--   - Activity: "my recent activity" feed (tenant + user + time DESC)
--   - Task: default-sort listing (tenant + createdAt DESC)
--   - Opportunity: active vs won/lost filtering (tenant + wonAt + lostAt)
--
-- Hand-authored, idempotent (IF NOT EXISTS), mirroring repo precedent
-- (see 20260423170000_add_website_analysis/migration.sql).
--
-- Note: the schema.prisma datasource also gains `directUrl = env("DIRECT_URL")`
-- in this changeset — that is a Prisma-config-only change and produces no SQL.
-- ============================================================================

-- Activity: composite for "my recent activity" feed
-- Schema field is `performedById` (the user FK on Activity); column name matches.
CREATE INDEX IF NOT EXISTS "Activity_tenantId_performedById_performedAt_idx"
  ON "Activity" ("tenantId", "performedById", "performedAt" DESC);

-- Task: default-sort
CREATE INDEX IF NOT EXISTS "Task_tenantId_createdAt_idx"
  ON "Task" ("tenantId", "createdAt" DESC);

-- Opportunity: active-vs-won/lost filter
CREATE INDEX IF NOT EXISTS "Opportunity_tenantId_wonAt_lostAt_idx"
  ON "Opportunity" ("tenantId", "wonAt", "lostAt");
