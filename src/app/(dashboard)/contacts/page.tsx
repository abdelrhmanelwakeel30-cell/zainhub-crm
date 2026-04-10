import { requirePermission } from '@/lib/auth-utils'
import { ContactsContent } from '@/components/contacts/contacts-content'

export default async function ContactsPage() {
  await requirePermission('contacts:view')
  return <ContactsContent />
}
