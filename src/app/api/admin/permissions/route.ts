import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

function isAdmin(roles?: string[]) {
  return roles?.includes('Super Admin') || roles?.includes('Admin')
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return unauthorized()
    if (!isAdmin(session.user.roles)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    })

    // Group by module for easier UI consumption
    const byModule = permissions.reduce((acc, p) => {
      if (!acc[p.module]) acc[p.module] = []
      acc[p.module].push(p)
      return acc
    }, {} as Record<string, typeof permissions>)

    return ok({ flat: permissions, byModule })
  } catch (err) {
    return serverError(err)
  }
}
