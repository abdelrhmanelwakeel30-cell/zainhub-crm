import { requirePermission } from '@/lib/auth-utils'
import { ContactDetail } from '@/components/contacts/contact-detail'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('contacts:view')
  const { id } = await params
  return <ContactDetail contactId={id} />
}
