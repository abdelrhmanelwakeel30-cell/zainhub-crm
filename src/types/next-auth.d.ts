import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      tenantId: string
      tenantName: string
      tenantSlug: string
      firstName: string
      lastName: string
      roles: string[]
      permissions: string[]
    } & DefaultSession['user']
  }

  interface User {
    id: string
    tenantId: string
    tenantName: string
    tenantSlug: string
    firstName: string
    lastName: string
    roles: string[]
    permissions: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    tenantId: string
    tenantName: string
    tenantSlug: string
    firstName: string
    lastName: string
    roles: string[]
    permissions: string[]
  }
}
