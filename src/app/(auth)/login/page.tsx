import { LoginForm } from '@/components/auth/login-form'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <ZainHubLogo variant="login" className="mb-5" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Sign in to your Zain Hub account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
