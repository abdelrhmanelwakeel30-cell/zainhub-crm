import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
            status: 'ACTIVE',
          },
          include: {
            tenant: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roles = user.userRoles.map((ur: any) => ur.role.name)
        const permissions: string[] = [
          ...new Set<string>(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user.userRoles.flatMap((ur: any) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ur.role.rolePermissions.map(
                (rp: any) => `${rp.permission.module}:${rp.permission.action}`
              )
            )
          ),
        ]

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          tenantSlug: user.tenant.slug,
          primaryColor: user.tenant.primaryColor ?? '#1E40AF',
          secondaryColor: user.tenant.secondaryColor ?? '#3B82F6',
          roles,
          permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.tenantName = user.tenantName
        token.tenantSlug = user.tenantSlug
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.primaryColor = user.primaryColor
        token.secondaryColor = user.secondaryColor
        token.roles = user.roles
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.tenantId = token.tenantId as string
      session.user.tenantName = token.tenantName as string
      session.user.tenantSlug = token.tenantSlug as string
      session.user.firstName = token.firstName as string
      session.user.lastName = token.lastName as string
      session.user.primaryColor = token.primaryColor as string
      session.user.secondaryColor = token.secondaryColor as string
      session.user.roles = token.roles as string[]
      session.user.permissions = token.permissions as string[]
      return session
    },
  },
})
