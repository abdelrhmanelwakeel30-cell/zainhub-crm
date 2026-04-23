-- ============================================================================
-- Migration: add_number_sequence_and_missing_columns
-- Generated: 2026-04-23
--
-- Fixes two P0 audit findings:
--   1. F-001: NumberSequence table missing → ALL create operations fail
--   2. F-002: Missing FK columns on Lead, Opportunity, Ticket → list queries fail
--
-- Safe to run on production Neon:
--   - All new columns are nullable (no backfill required)
--   - CREATE TABLE IF NOT EXISTS guards against re-run errors
--   - ADD COLUMN IF NOT EXISTS guards against re-run errors
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NumberSequence table (F-001)
--    Enables atomic per-tenant number generation: COM-0001, LD-0001, INV-0001
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "NumberSequence" (
    "tenantId"   TEXT         NOT NULL,
    "entityType" TEXT         NOT NULL,
    "lastNumber" INTEGER      NOT NULL DEFAULT 0,
    "prefix"     TEXT,
    "padLength"  INTEGER      NOT NULL DEFAULT 4,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("tenantId","entityType")
);

CREATE INDEX IF NOT EXISTS "NumberSequence_tenantId_idx" ON "NumberSequence"("tenantId");

-- FK: NumberSequence.tenantId → Tenant.id
-- (add only if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'NumberSequence_tenantId_fkey'
    ) THEN
        ALTER TABLE "NumberSequence"
            ADD CONSTRAINT "NumberSequence_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Lead.companyId and Lead.contactId (F-002)
-- ----------------------------------------------------------------------------
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Lead_companyId_fkey'
    ) THEN
        ALTER TABLE "Lead"
            ADD CONSTRAINT "Lead_companyId_fkey"
            FOREIGN KEY ("companyId") REFERENCES "Company"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Lead_contactId_fkey'
    ) THEN
        ALTER TABLE "Lead"
            ADD CONSTRAINT "Lead_contactId_fkey"
            FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS "Lead_companyId_idx" ON "Lead"("companyId");
CREATE INDEX IF NOT EXISTS "Lead_contactId_idx" ON "Lead"("contactId");

-- ----------------------------------------------------------------------------
-- 3. Opportunity.leadId (F-002)
-- ----------------------------------------------------------------------------
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "leadId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Opportunity_leadId_fkey'
    ) THEN
        ALTER TABLE "Opportunity"
            ADD CONSTRAINT "Opportunity_leadId_fkey"
            FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Ticket.contactId (F-002)
-- ----------------------------------------------------------------------------
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_contactId_fkey'
    ) THEN
        ALTER TABLE "Ticket"
            ADD CONSTRAINT "Ticket_contactId_fkey"
            FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS "Ticket_contactId_idx" ON "Ticket"("contactId");
