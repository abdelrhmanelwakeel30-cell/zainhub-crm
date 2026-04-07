import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth()
    if (!session) redirect('/login')
  } catch {
    redirect('/login')
  }

  return <AppShell>{children}</AppShell>
}
