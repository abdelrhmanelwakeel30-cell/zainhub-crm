import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { log } from '@/lib/logger'
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  tenantSlug: z.string().min(1),
  companyId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, firstName, lastName, phone, tenantSlug, companyId } = parsed.data

    // Resolve tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 })
    }

    // Check uniqueness within tenant
    const existing = await prisma.clientPortalUser.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    // Validate companyId belongs to tenant if provided
    if (companyId) {
      const company = await prisma.company.findFirst({
        where: { id: companyId, tenantId: tenant.id },
      })
      if (!company) {
        return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.clientPortalUser.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone ?? null,
        companyId: companyId ?? null,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Registration successful. Please verify your email.' },
      { status: 201 },
    )
  } catch (err) {
    log.error('[client-portal/auth/register]', { err: err })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
