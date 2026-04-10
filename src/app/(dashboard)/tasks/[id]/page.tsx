import { requirePermission } from '@/lib/auth-utils'
import { TaskDetail } from '@/components/tasks/task-detail'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('tasks:view')
  const { id } = await params
  return <TaskDetail taskId={id} />
}
