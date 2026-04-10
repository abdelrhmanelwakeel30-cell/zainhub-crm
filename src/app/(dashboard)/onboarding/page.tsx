import { requirePermission } from '@/lib/auth-utils'
import { OnboardingContent } from '@/components/onboarding/onboarding-content'

export default async function OnboardingPage() {
  await requirePermission('projects:view')
  return <OnboardingContent />
}
