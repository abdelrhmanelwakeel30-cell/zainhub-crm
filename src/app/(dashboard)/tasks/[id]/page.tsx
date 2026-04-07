import { TaskDetail } from '@/components/tasks/task-detail'

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TaskDetail taskId={id} />
}
