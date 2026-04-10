import { requirePermission } from '@/lib/auth-utils'
import { SocialAccountsContent } from '@/components/social-accounts/social-accounts-content'

export default async function SocialAccountsPage() {
  await requirePermission('social_media:view')
  return <SocialAccountsContent />
}
