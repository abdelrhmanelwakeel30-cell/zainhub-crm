import { requirePermission } from '@/lib/auth-utils'
import { AuditLogContent } from '@/components/admin/audit-log-content'

export default async function AuditLogPage() {
  await requirePermission('audit_log:view')
  return <AuditLogContent />
}
