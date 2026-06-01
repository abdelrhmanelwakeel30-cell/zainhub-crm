import { requirePermission } from '@/lib/auth-utils'
import { InventoryContent } from '@/components/admin/inventory-content'

export default async function InventoryPage() {
  await requirePermission('inventory:view')
  return <InventoryContent />
}
