import { requirePermission } from '@/lib/auth-utils'
import { ContentCalendarContent } from '@/components/content-calendar/content-calendar-content'

export default async function PageCalendarPage() {
  await requirePermission('social_media:view')
  return <ContentCalendarContent />
}
