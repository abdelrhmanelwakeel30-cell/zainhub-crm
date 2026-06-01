import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireApiPermission } from '@/lib/auth-utils'
import { serverError, ok } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

const UpsertSettingSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

const BulkUpsertSchema = z.object({
  settings: z.array(UpsertSettingSchema),
})

export async function GET(req: NextRequest) {
  const guard = await requireApiPermission('settings:view')
  if (!guard.ok) return guard.response
  const session = guard.session
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')

    const where = key
      ? { tenantId: session.user.tenantId, key }
      : { tenantId: session.user.tenantId }

    const settings = await prisma.setting.findMany({ where, orderBy: { key: 'asc' }, take: 500 })

    // Also include tenant-level settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        name: true, logo: true, logoDark: true, favicon: true,
        primaryColor: true, secondaryColor: true, domain: true,
        defaultCurrency: true, defaultLanguage: true, timezone: true,
        taxRegistrationNumber: true, address: true, phone: true,
        email: true, website: true, plan: true,
      },
    })

    return ok({ settings, tenant })
  } catch (err) {
    return serverError(err)
  }
}

export async function PUT(req: NextRequest) {
  // Upsert key/value entries into the tenant-scoped Setting store (JSON values).
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const session = guard.session
  try {
    const body = await req.json()

    // Support both single setting and bulk update
    if (body.settings) {
      const parsed = BulkUpsertSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
      }
      const results = await Promise.all(
        parsed.data.settings.map((s) =>
          prisma.setting.upsert({
            where: { tenantId_key: { tenantId: session.user.tenantId, key: s.key } },
            create: { tenantId: session.user.tenantId, key: s.key, value: s.value as never },
            update: { value: s.value as never },
          })
        )
      )
      return ok(results)
    }

    const parsed = UpsertSettingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { tenantId_key: { tenantId: session.user.tenantId, key: parsed.data.key } },
      create: { tenantId: session.user.tenantId, key: parsed.data.key, value: parsed.data.value as never },
      update: { value: parsed.data.value as never },
    })

    return ok(setting)
  } catch (err) {
    return serverError(err)
  }
}

export async function PATCH(req: NextRequest) {
  // Update tenant-level branding/locale fields (name, colors, currency, etc.).
  const guard = await requireApiPermission('settings:edit')
  if (!guard.ok) return guard.response
  const session = guard.session
  try {
    const TenantSchema = z.object({
      name: z.string().min(1).optional(),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      defaultCurrency: z.enum(['AED','SAR','USD','EUR','GBP','EGP','KWD','QAR','BHD','OMR']).optional(),
      defaultLanguage: z.enum(['en','ar']).optional(),
      timezone: z.string().optional(),
      taxRegistrationNumber: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().optional(),
    }).strict()

    const body = await req.json()
    const parsed = TenantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: parsed.data,
    })

    return ok(tenant)
  } catch (err) {
    return serverError(err)
  }
}
