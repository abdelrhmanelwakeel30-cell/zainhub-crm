-- ============================================================================
-- Migration: add_auditlog_missing_columns
-- Generated: 2026-04-25
--
-- Closes a long-standing schema drift on AuditLog. The Prisma schema added
-- `beforeValue`, `afterValue`, `sourceModule` and an index on
-- `(tenantId, action, createdAt)` at some point, but no migration ever
-- shipped the corresponding ALTER TABLE / CREATE INDEX. Production
-- crashed with P2022 ColumnNotFound when /api/admin/audit-log ran.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- ============================================================================

ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "beforeValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "afterValue" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "sourceModule" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_action_createdAt_idx"
  ON "AuditLog" ("tenantId", "action", "createdAt");
