import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  let user = { firstName: 'User', lastName: '', email: '' }

  try {
    const session = await auth()
    if (!session?.user) redirect('/login')
    user = {
      firstName: session.user.firstName || session.user.name?.split(' ')[0] || 'User',
      lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
      email: session.user.email || '',
    }
  } catch {
    redirect('/login')
  }

  return <DashboardContent user={user} />
}
