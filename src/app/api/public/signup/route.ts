import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { parseJson } from '@/lib/api-helpers'
import { log } from '@/lib/logger'

const schema = z.object({
  company: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
})

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'tenant'
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  for (let i = 2; i < 1000; i++) {
    const exists = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
    if (!exists) return slug
    slug = `${base}-${i}`
  }
  // Extremely unlikely fallback
  return `${base}-${Date.now()}`
}

/**
 * Public self-serve onboarding (S-2). Creates a new tenant + its first admin
 * user (Super Admin role granted every permission) in a single transaction.
 * No auth required — must stay under /api/public (middleware-allowlisted).
 */
export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, schema)
  if (parsed instanceof NextResponse) return parsed
  const { company, name, email, password } = parsed.data
  const normalizedEmail = email.trim().toLowerCase()

  try {
    // Guard: email must be globally unused (login resolves users by email alone).
    const emailTaken = await prisma.user.findFirst({ where: { email: normalizedEmail }, select: { id: true } })
    if (emailTaken) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 })
    }

    const slug = await uniqueSlug(slugify(company))
    const passwordHash = await bcrypt.hash(password, 12)
    const [firstName, ...rest] = name.trim().split(/\s+/)
    const lastName = rest.join(' ') || '-'

    // All permissions are global (unique [module, action]); grant them all.
    const permissions = await prisma.permission.findMany({ select: { id: true } })

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: company.trim(), slug },
      })

      const role = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Super Admin',
          nameAr: 'مدير عام',
          description: 'Full access to all modules',
          isSystem: true,
          rolePermissions: {
            create: permissions.map((p) => ({ permissionId: p.id })),
          },
        },
      })

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          status: 'ACTIVE',
          userRoles: { create: { roleId: role.id } },
        },
      })

      return { tenantId: tenant.id, slug: tenant.slug, userId: user.id }
    })

    log.info('[signup] new tenant onboarded', { slug: result.slug })
    return NextResponse.json({ success: true, data: { slug: result.slug, email: normalizedEmail } }, { status: 201 })
  } catch (err) {
    log.error('POST /api/public/signup', { err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
