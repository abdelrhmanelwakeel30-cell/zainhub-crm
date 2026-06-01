/**
 * Seed CRM identities for the 166 AI agents (paperclip "AI-native digital
 * agency" platform).
 *
 *   - 19 department roles (RBAC mapped to the CRM permission catalogue)
 *   - 1 CRM User per agent (isServiceAccount=true, linked by agentId)
 *   - 1 AgentApiKey per agent (sha256-hashed; plaintext written ONCE to a
 *     gitignored file for wiring into the CRM MCP server / agents)
 *
 * Idempotent: re-running upserts users/roles and never regenerates an existing
 * key (plaintext can't be recovered). Pass --rotate to mint fresh keys.
 *
 * Run:  npx tsx prisma/seed-agents.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import { createHash, randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.DATABASE_URL!
const prisma =
  url.includes('neon.tech') || url.includes('neon.database')
    ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) })
    : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const TENANT_SLUG = process.env.AGENT_TENANT_SLUG || 'zainhub'
const EMAIL_DOMAIN = process.env.AGENT_EMAIL_DOMAIN || 'agents.zainhub.ae'
const ROTATE = process.argv.includes('--rotate')

// Must mirror the app permission catalogue (prisma/seed.ts).
const MODULES = [
  'dashboard', 'leads', 'companies', 'contacts', 'opportunities', 'projects',
  'tasks', 'quotations', 'proposals', 'contracts', 'invoices', 'payments',
  'expenses', 'tickets', 'social_media', 'campaigns', 'documents', 'reports',
  'users', 'roles', 'settings', 'audit_log', 'change_requests', 'approvals',
  'deliverables', 'preview_links', 'comms', 'client_services', 'subscriptions',
  'bundles', 'forms', 'account_health', 'onboarding', 'website_analysis',
  'employees', 'leave', 'payroll', 'accounting', 'procurement', 'inventory',
]
const ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'approve']

/** Expand module list × action list into "module:action" permission strings. */
function g(modules: string[], actions: string[]): string[] {
  const out: string[] = []
  for (const m of modules) for (const a of actions) out.push(`${m}:${a}`)
  return out
}
const VIEW = ['view']
const CRU = ['view', 'create', 'edit']
const CRUE = ['view', 'create', 'edit', 'export']

// Department -> CRM role definition. Permissions are intentionally
// least-privilege per the department's real function.
const ROLE_MATRIX: Record<string, { name: string; nameAr: string; permissions: string[] }> = {
  'dept-01-leadership': {
    name: 'ZH Leadership Agents',
    nameAr: 'وكلاء القيادة',
    permissions: [...new Set([
      ...g(MODULES, ['view', 'export']),
      ...g(['leads', 'opportunities', 'projects', 'reports', 'approvals'], ['approve']),
      ...g(['reports'], ['create', 'edit']),
    ])],
  },
  'dept-02-sales': {
    name: 'ZH Sales Agents',
    nameAr: 'وكلاء المبيعات',
    permissions: g(['leads', 'companies', 'contacts', 'opportunities', 'quotations', 'proposals', 'campaigns', 'client_services'], CRUE).concat(g(['dashboard', 'reports'], VIEW)),
  },
  'dept-03-marketing': {
    name: 'ZH Marketing Agents',
    nameAr: 'وكلاء التسويق',
    permissions: g(['campaigns', 'social_media', 'forms', 'leads'], CRUE).concat(g(['dashboard', 'reports', 'documents'], VIEW)),
  },
  'dept-04-delivery': {
    name: 'ZH Delivery Agents',
    nameAr: 'وكلاء التنفيذ',
    permissions: g(['projects', 'tasks', 'deliverables', 'contracts', 'change_requests', 'preview_links', 'client_services', 'onboarding'], CRU).concat(g(['documents'], ['view', 'create'])).concat(g(['dashboard', 'reports'], VIEW)),
  },
  'dept-05-quality': {
    name: 'ZH Quality Agents',
    nameAr: 'وكلاء الجودة',
    permissions: g(['projects', 'tasks', 'deliverables', 'account_health', 'tickets'], VIEW).concat(g(['approvals'], ['view', 'approve'])).concat(g(['reports'], ['view', 'export'])).concat(g(['dashboard'], VIEW)),
  },
  'dept-06-audit': {
    name: 'ZH Audit Agents',
    nameAr: 'وكلاء التدقيق',
    permissions: g(['audit_log', 'reports'], ['view', 'export']).concat(g(['leads', 'companies', 'contacts', 'opportunities', 'projects', 'invoices', 'payments', 'contracts', 'expenses'], VIEW)).concat(g(['dashboard'], VIEW)),
  },
  'dept-07-customer-success': {
    name: 'ZH Customer Success Agents',
    nameAr: 'وكلاء نجاح العملاء',
    permissions: g(['tickets', 'account_health', 'client_services', 'subscriptions', 'contacts', 'comms', 'onboarding'], CRU).concat(g(['dashboard', 'reports'], VIEW)),
  },
  'dept-08-finance': {
    name: 'ZH Finance Agents',
    nameAr: 'وكلاء المالية',
    permissions: g(['invoices', 'payments', 'expenses', 'quotations', 'subscriptions', 'bundles', 'payroll', 'accounting'], ['view', 'create', 'edit', 'export', 'approve']).concat(g(['reports'], ['view', 'export'])).concat(g(['dashboard'], VIEW)),
  },
  'dept-09-legal': {
    name: 'ZH Legal Agents',
    nameAr: 'وكلاء الشؤون القانونية',
    permissions: g(['contracts', 'proposals', 'documents'], CRU).concat(g(['approvals'], ['view', 'approve'])).concat(g(['dashboard', 'reports'], VIEW)),
  },
  'dept-10-compliance': {
    name: 'ZH Compliance Agents',
    nameAr: 'وكلاء الامتثال',
    permissions: g(['audit_log', 'documents', 'reports'], ['view', 'export']).concat(g(['approvals'], ['view', 'approve'])).concat(g(['contracts', 'invoices', 'payments'], VIEW)).concat(g(['dashboard'], VIEW)),
  },
  'dept-11-security': {
    name: 'ZH Security Agents',
    nameAr: 'وكلاء الأمن',
    permissions: g(['audit_log', 'users', 'settings'], VIEW).concat(g(['reports'], ['view', 'export'])).concat(g(['dashboard'], VIEW)),
  },
  'dept-12-it-operations': {
    name: 'ZH IT Operations Agents',
    nameAr: 'وكلاء عمليات تقنية المعلومات',
    permissions: g(['settings', 'users', 'website_analysis', 'reports'], CRU).concat(g(['inventory'], ['view', 'create', 'edit'])).concat(g(['audit_log'], VIEW)).concat(g(['dashboard'], VIEW)),
  },
  'dept-13-data-knowledge': {
    name: 'ZH Data & Knowledge Agents',
    nameAr: 'وكلاء البيانات والمعرفة',
    permissions: g(['reports', 'documents', 'website_analysis'], CRUE).concat(g(['leads', 'companies', 'opportunities', 'invoices'], VIEW)).concat(g(['dashboard'], VIEW)),
  },
  'dept-14-hr-workforce': {
    name: 'ZH HR & Workforce Agents',
    nameAr: 'وكلاء الموارد البشرية',
    permissions: g(['employees'], ['view', 'create', 'edit', 'export'])
      .concat(g(['leave'], ['view', 'create', 'edit', 'approve']))
      .concat(g(['users'], CRU))
      .concat(g(['dashboard', 'reports'], VIEW)),
  },
  'dept-15-partners': {
    name: 'ZH Partners Agents',
    nameAr: 'وكلاء الشركاء',
    permissions: g(['companies', 'contacts', 'contracts', 'client_services'], CRU).concat(g(['procurement'], ['view', 'create', 'edit', 'approve'])).concat(g(['dashboard', 'reports'], VIEW)),
  },
  'dept-16-agent-factory': {
    name: 'ZH Agent Factory Agents',
    nameAr: 'وكلاء مصنع الوكلاء',
    permissions: g(['dashboard', 'reports', 'audit_log', 'settings'], VIEW),
  },
  'dept-17-trust-proof': {
    name: 'ZH Trust & Proof Agents',
    nameAr: 'وكلاء الثقة والإثبات',
    permissions: g(['proposals', 'documents', 'preview_links', 'reports'], ['view', 'create']).concat(g(['companies', 'contacts'], VIEW)).concat(g(['dashboard'], VIEW)),
  },
  'dept-18-uae-gcc-market': {
    name: 'ZH UAE/GCC Market Agents',
    nameAr: 'وكلاء سوق الإمارات والخليج',
    permissions: g(['leads', 'companies', 'campaigns', 'reports'], ['view', 'create']).concat(g(['contacts'], VIEW)).concat(g(['dashboard'], VIEW)),
  },
  'dept-19-growth-referral': {
    name: 'ZH Growth & Referral Agents',
    nameAr: 'وكلاء النمو والإحالة',
    permissions: g(['leads', 'campaigns', 'contacts', 'client_services'], CRU).concat(g(['dashboard', 'reports'], VIEW)),
  },
}

interface AgentRow {
  agentId: string
  name: string
  tier: string
  department: string
  departmentName: string
  subDepartment: string
  reportsTo: string | null
  model: string
}

function hashKey(key: string) {
  return createHash('sha256').update(key).digest('hex')
}
function newKey() {
  const key = 'zhk_' + randomBytes(24).toString('hex')
  return { key, keyHash: hashKey(key), keyPrefix: key.slice(0, 12) }
}

async function main() {
  console.log('🤖 Seeding 166 AI-agent CRM identities...')

  // 1) Tenant
  let tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } })
  if (!tenant) {
    console.log(`  · tenant "${TENANT_SLUG}" not found — creating minimal tenant`)
    tenant = await prisma.tenant.create({
      data: { name: 'Zain Hub AI Solutions', slug: TENANT_SLUG, defaultCurrency: 'AED', timezone: 'Asia/Dubai' },
    })
  }

  // 2) Ensure the full permission catalogue exists
  const permIds = new Map<string, string>()
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const p = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { module, action, description: `${action} ${module}` },
      })
      permIds.set(`${module}:${action}`, p.id)
    }
  }
  console.log(`  · ${permIds.size} permissions ensured`)

  // 3) Department roles + their permissions
  const roleByDept = new Map<string, string>()
  for (const [dept, def] of Object.entries(ROLE_MATRIX)) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: def.name } },
      update: { nameAr: def.nameAr, description: `AI agents — ${def.name}` },
      create: { tenantId: tenant.id, name: def.name, nameAr: def.nameAr, description: `AI agents — ${def.name}`, isSystem: true },
    })
    roleByDept.set(dept, role.id)
    // Reset role permissions to the matrix (idempotent)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    const wanted = [...new Set(def.permissions)].map((p) => permIds.get(p)).filter(Boolean) as string[]
    await prisma.rolePermission.createMany({
      data: wanted.map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    })
  }
  console.log(`  · ${roleByDept.size} department roles configured`)

  // 4) Agents
  const data = JSON.parse(readFileSync(join(process.cwd(), 'prisma/data/agents.json'), 'utf8'))
  const agents: AgentRow[] = data.agents
  const issuedKeys: Array<Record<string, string>> = []
  let createdUsers = 0
  let createdKeys = 0
  let existingKeys = 0

  for (const a of agents) {
    const roleId = roleByDept.get(a.department)
    if (!roleId) {
      console.warn(`  ! no role for department ${a.department} (agent ${a.agentId}) — skipping`)
      continue
    }
    const email = `${a.agentId}@${EMAIL_DOMAIN}`.toLowerCase()
    const [firstName, ...rest] = a.name.replace(/ Agent$/i, '').split(' ')

    const user = await prisma.user.upsert({
      where: { agentId: a.agentId },
      update: { status: 'ACTIVE', isServiceAccount: true, department: a.departmentName, jobTitle: a.subDepartment || a.name },
      create: {
        tenantId: tenant.id,
        agentId: a.agentId,
        email,
        firstName: firstName || a.agentId,
        lastName: rest.join(' ') || '(Agent)',
        status: 'ACTIVE',
        isServiceAccount: true,
        department: a.departmentName,
        jobTitle: a.subDepartment || a.name,
        preferredLanguage: 'en',
      },
    })
    if (user.createdAt.getTime() === user.updatedAt.getTime()) createdUsers++

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    })

    // API key
    const existing = await prisma.agentApiKey.findUnique({ where: { agentId: a.agentId } })
    if (existing && !ROTATE) {
      existingKeys++
      continue
    }
    const k = newKey()
    if (existing && ROTATE) {
      await prisma.agentApiKey.update({
        where: { agentId: a.agentId },
        data: { keyHash: k.keyHash, keyPrefix: k.keyPrefix, revokedAt: null },
      })
    } else {
      await prisma.agentApiKey.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          agentId: a.agentId,
          name: a.name,
          keyHash: k.keyHash,
          keyPrefix: k.keyPrefix,
          scopes: [],
        },
      })
    }
    createdKeys++
    issuedKeys.push({
      agentId: a.agentId,
      name: a.name,
      email,
      department: a.department,
      role: ROLE_MATRIX[a.department].name,
      key: k.key,
      keyPrefix: k.keyPrefix,
    })
  }

  // 5) Write plaintext keys (ONCE) to a gitignored file for wiring
  if (issuedKeys.length) {
    const outPath = join(process.cwd(), 'prisma/data/agent-keys.local.json')
    writeFileSync(outPath, JSON.stringify({ tenant: TENANT_SLUG, generated: new Date().toISOString(), count: issuedKeys.length, keys: issuedKeys }, null, 2))
    console.log(`  · wrote ${issuedKeys.length} plaintext keys to prisma/data/agent-keys.local.json (gitignored)`)
  }

  console.log(`✅ Agents seeded: ${agents.length} total | users created: ${createdUsers} | keys issued: ${createdKeys} | keys kept: ${existingKeys}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
