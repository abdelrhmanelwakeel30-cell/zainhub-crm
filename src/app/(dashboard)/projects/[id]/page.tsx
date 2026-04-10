import { requirePermission } from '@/lib/auth-utils'
import { ProjectDetail } from '@/components/projects/project-detail'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('projects:view')
  const { id } = await params
  return <ProjectDetail projectId={id} />
}
