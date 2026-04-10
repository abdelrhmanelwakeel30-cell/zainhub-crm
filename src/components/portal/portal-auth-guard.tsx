'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePortalAuth } from './portal-auth-provider'

export function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = usePortalAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/portal/login')
    }
  }, [token, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!token) return null

  return <>{children}</>
}
