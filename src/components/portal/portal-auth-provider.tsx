'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface PortalUser {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  avatar?: string | null
  emailVerified: boolean
  status: string
  companyId?: string | null
  contactId?: string | null
  mfaEnabled: boolean
  lastLoginAt?: string | null
  createdAt: string
  company?: { id: string; displayName: string } | null
}

interface PortalAuthContextValue {
  user: PortalUser | null
  token: string | null
  isLoading: boolean
  logout: () => void
  setToken: (token: string) => void
}

const PortalAuthContext = createContext<PortalAuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  logout: () => {},
  setToken: () => {},
})

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async (jwt: string) => {
    try {
      const res = await fetch('/api/client-portal/auth/me', {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      if (!res.ok) {
        localStorage.removeItem('portal_token')
        setTokenState(null)
        setUser(null)
        return
      }
      const data = await res.json()
      if (data.success) setUser(data.data)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('portal_token')
    if (stored) {
      setTokenState(stored)
      fetchUser(stored).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [fetchUser])

  const setToken = useCallback(
    (jwt: string) => {
      localStorage.setItem('portal_token', jwt)
      setTokenState(jwt)
      fetchUser(jwt)
    },
    [fetchUser],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('portal_token')
    setTokenState(null)
    setUser(null)
    router.push('/portal/login')
  }, [router])

  return (
    <PortalAuthContext.Provider value={{ user, token, isLoading, logout, setToken }}>
      {children}
    </PortalAuthContext.Provider>
  )
}

export function usePortalAuth() {
  return useContext(PortalAuthContext)
}
