import { requirePermission } from '@/lib/auth-utils'
import { TasksContent } from '@/components/tasks/tasks-content'

export default async function TasksPage() {
  await requirePermission('tasks:view')
  return <TasksContent />
}
