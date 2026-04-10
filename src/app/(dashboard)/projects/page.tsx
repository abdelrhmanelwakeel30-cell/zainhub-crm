import { requirePermission } from '@/lib/auth-utils'
import { ProjectsContent } from '@/components/projects/projects-content'

export default async function ProjectsPage() {
  await requirePermission('projects:view')
  return <ProjectsContent />
}
