-- F-5: hot-path composite indexes (additive, index-only)
CREATE INDEX "Vendor_tenantId_isActive_idx" ON "Vendor"("tenantId", "isActive");
CREATE INDEX "WebhookEndpoint_tenantId_isActive_idx" ON "WebhookEndpoint"("tenantId", "isActive");
