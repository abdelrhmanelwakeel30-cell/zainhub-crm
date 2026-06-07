-- AlterTable: mark agent service-account users
ALTER TABLE "User" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "isServiceAccount" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: programmatic credential for AI agents (paperclip platform)
CREATE TABLE "AgentApiKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentApiKey_userId_key" ON "AgentApiKey"("userId");
CREATE UNIQUE INDEX "AgentApiKey_agentId_key" ON "AgentApiKey"("agentId");
CREATE UNIQUE INDEX "AgentApiKey_keyHash_key" ON "AgentApiKey"("keyHash");
CREATE INDEX "AgentApiKey_tenantId_idx" ON "AgentApiKey"("tenantId");
CREATE INDEX "AgentApiKey_keyHash_idx" ON "AgentApiKey"("keyHash");
CREATE UNIQUE INDEX "User_agentId_key" ON "User"("agentId");

-- AddForeignKey
ALTER TABLE "AgentApiKey" ADD CONSTRAINT "AgentApiKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentApiKey" ADD CONSTRAINT "AgentApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
