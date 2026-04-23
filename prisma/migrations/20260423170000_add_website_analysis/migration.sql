-- ============================================================================
-- Migration: add_website_analysis
-- Generated: 2026-04-23
--
-- Website Analysis module (Phase 1 — foundation):
--   - enums: WebsiteType, WebsiteStatus, WebsiteIntegrationProvider,
--            IntegrationStatus, SyncStatus
--   - tables: Website, WebsiteIntegration, WebsiteSyncLog
--
-- All tables tenant-scoped. Hand-authored (not via `prisma migrate dev`)
-- to avoid reset triggered by pre-existing drift from prior P0 fixes
-- (extra indexes + AuditLog columns). Safe to re-run thanks to IF NOT EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE "WebsiteType" AS ENUM (
        'CORPORATE', 'ECOMMERCE', 'LANDING_PAGE', 'PORTFOLIO',
        'BLOG', 'SAAS', 'CAMPAIGN_PAGE', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "WebsiteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "WebsiteIntegrationProvider" AS ENUM (
        'GA4', 'SEARCH_CONSOLE', 'CLARITY', 'GTM',
        'GOOGLE_ADS', 'META_PIXEL', 'LINKEDIN_INSIGHT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "IntegrationStatus" AS ENUM (
        'NOT_CONNECTED', 'CONNECTED', 'ERROR', 'EXPIRED', 'SYNCING'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. Website
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Website" (
    "id"              TEXT             NOT NULL,
    "tenantId"        TEXT             NOT NULL,
    "name"            TEXT             NOT NULL,
    "domain"          TEXT             NOT NULL,
    "brand"           TEXT,
    "type"            "WebsiteType"    NOT NULL DEFAULT 'CORPORATE',
    "primaryMarket"   TEXT,
    "primaryLanguage" TEXT,
    "notes"           TEXT,
    "status"          "WebsiteStatus"  NOT NULL DEFAULT 'ACTIVE',
    "ownerUserId"     TEXT,
    "createdById"     TEXT             NOT NULL,
    "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Website_tenantId_domain_key"
    ON "Website"("tenantId", "domain");
CREATE INDEX IF NOT EXISTS "Website_tenantId_status_idx"
    ON "Website"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Website_tenantId_type_idx"
    ON "Website"("tenantId", "type");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Website_tenantId_fkey') THEN
        ALTER TABLE "Website" ADD CONSTRAINT "Website_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Website_ownerUserId_fkey') THEN
        ALTER TABLE "Website" ADD CONSTRAINT "Website_ownerUserId_fkey"
            FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Website_createdById_fkey') THEN
        ALTER TABLE "Website" ADD CONSTRAINT "Website_createdById_fkey"
            FOREIGN KEY ("createdById") REFERENCES "User"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. WebsiteIntegration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "WebsiteIntegration" (
    "id"                   TEXT                         NOT NULL,
    "tenantId"             TEXT                         NOT NULL,
    "websiteId"            TEXT                         NOT NULL,
    "provider"             "WebsiteIntegrationProvider" NOT NULL,
    "status"               "IntegrationStatus"          NOT NULL DEFAULT 'NOT_CONNECTED',
    "externalAccountId"    TEXT,
    "externalAccountLabel" TEXT,
    "accessTokenEnc"       TEXT,
    "refreshTokenEnc"      TEXT,
    "tokenExpiresAt"       TIMESTAMP(3),
    "scopes"               TEXT[],
    "lastSyncAt"           TIMESTAMP(3),
    "lastSyncStatus"       "SyncStatus",
    "lastErrorMsg"         TEXT,
    "connectedById"        TEXT,
    "connectedAt"          TIMESTAMP(3),
    "disconnectedAt"       TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)                 NOT NULL,

    CONSTRAINT "WebsiteIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteIntegration_websiteId_provider_key"
    ON "WebsiteIntegration"("websiteId", "provider");
CREATE INDEX IF NOT EXISTS "WebsiteIntegration_tenantId_status_idx"
    ON "WebsiteIntegration"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "WebsiteIntegration_tenantId_provider_idx"
    ON "WebsiteIntegration"("tenantId", "provider");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteIntegration_tenantId_fkey') THEN
        ALTER TABLE "WebsiteIntegration" ADD CONSTRAINT "WebsiteIntegration_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteIntegration_websiteId_fkey') THEN
        ALTER TABLE "WebsiteIntegration" ADD CONSTRAINT "WebsiteIntegration_websiteId_fkey"
            FOREIGN KEY ("websiteId") REFERENCES "Website"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteIntegration_connectedById_fkey') THEN
        ALTER TABLE "WebsiteIntegration" ADD CONSTRAINT "WebsiteIntegration_connectedById_fkey"
            FOREIGN KEY ("connectedById") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. WebsiteSyncLog
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "WebsiteSyncLog" (
    "id"             TEXT         NOT NULL,
    "tenantId"       TEXT         NOT NULL,
    "websiteId"      TEXT         NOT NULL,
    "integrationId"  TEXT         NOT NULL,
    "status"         "SyncStatus" NOT NULL,
    "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt"     TIMESTAMP(3),
    "rowsProcessed"  INTEGER,
    "errorSummary"   TEXT,
    "errorDetail"    JSONB,
    "retryOf"        TEXT,

    CONSTRAINT "WebsiteSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WebsiteSyncLog_tenantId_websiteId_startedAt_idx"
    ON "WebsiteSyncLog"("tenantId", "websiteId", "startedAt");
CREATE INDEX IF NOT EXISTS "WebsiteSyncLog_integrationId_startedAt_idx"
    ON "WebsiteSyncLog"("integrationId", "startedAt");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteSyncLog_tenantId_fkey') THEN
        ALTER TABLE "WebsiteSyncLog" ADD CONSTRAINT "WebsiteSyncLog_tenantId_fkey"
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteSyncLog_websiteId_fkey') THEN
        ALTER TABLE "WebsiteSyncLog" ADD CONSTRAINT "WebsiteSyncLog_websiteId_fkey"
            FOREIGN KEY ("websiteId") REFERENCES "Website"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WebsiteSyncLog_integrationId_fkey') THEN
        ALTER TABLE "WebsiteSyncLog" ADD CONSTRAINT "WebsiteSyncLog_integrationId_fkey"
            FOREIGN KEY ("integrationId") REFERENCES "WebsiteIntegration"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
