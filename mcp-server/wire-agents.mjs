#!/usr/bin/env node
/**
 * Generate the agent-side wiring that connects the 166 paperclip agents to the
 * CRM MCP server. Produces:
 *
 *   <agency>/paperclip/config/crm-integration.json   (committed-safe registry:
 *       per-agent role + allowed CRM tools + MCP launch spec; NO plaintext keys)
 *   <agency>/data/crm-agent-keys.json                 (gitignored secrets:
 *       { "<agentId>": "zhk_..." } — runtime injects the key when dispatching)
 *
 * The runtime, when dispatching agent X: read its key from the secrets file,
 * launch the CRM MCP with CRM_AGENT_KEY=<key>, and expose allowedTools[X].
 * RBAC + audit are enforced server-side regardless of allowedTools.
 *
 * Run:  npx tsx --env-file=.env mcp-server/wire-agents.mjs   (from CRM root)
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaNeon } from '@prisma/adapter-neon'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const CRM_ROOT = process.cwd()
const AGENCY_ROOT = process.env.AGENCY_ROOT || '/Volumes/IMac/Claude/Zain hub/AI-native digital agency'
const MCP_ENTRY = join(CRM_ROOT, 'mcp-server/index.mjs')
const CRM_BASE_URL = process.env.CRM_PUBLIC_URL || 'http://localhost:3000'

const url = process.env.DATABASE_URL
const prisma =
  url.includes('neon.tech') || url.includes('neon.database')
    ? new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) })
    : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

// MCP tool -> CRM permission it needs. Used to compute each agent's allowed
// tool list from its real RBAC permissions. crm_whoami + crm_request are
// always available (RBAC still governs every underlying call).
const TOOL_PERMS = {
  crm_list_leads: 'leads:view',
  crm_create_lead: 'leads:create',
  crm_list_companies: 'companies:view',
  crm_create_company: 'companies:create',
  crm_list_contacts: 'contacts:view',
  crm_create_contact: 'contacts:create',
  crm_create_task: 'tasks:create',
  crm_list_tickets: 'tickets:view',
  crm_create_ticket: 'tickets:create',
  crm_list_opportunities: 'opportunities:view',
}
const ALWAYS = ['crm_whoami', 'crm_request']

function has(perms, p) {
  if (perms.has('*:*') || perms.has(p)) return true
  const [m] = p.split(':')
  return perms.has(`${m}:*`)
}

async function main() {
  const data = JSON.parse(readFileSync(join(CRM_ROOT, 'prisma/data/agents.json'), 'utf8'))
  const keysFile = JSON.parse(readFileSync(join(CRM_ROOT, 'prisma/data/agent-keys.local.json'), 'utf8'))
  const keyByAgent = new Map(keysFile.keys.map((k) => [k.agentId, k.key]))

  const registry = {
    meta: {
      generated: new Date().toISOString(),
      crmBaseUrl: CRM_BASE_URL,
      note: 'RBAC + audit enforced server-side by the CRM. allowedTools is guidance; the CRM rejects any call the agent lacks permission for.',
    },
    mcpServer: {
      command: 'node',
      args: [MCP_ENTRY],
      env: {
        CRM_BASE_URL: '${CRM_BASE_URL}',
        CRM_AGENT_KEY: '<injected per-agent from data/crm-agent-keys.json>',
      },
    },
    agents: {},
  }
  const secrets = {}
  let missingKey = 0

  for (const a of data.agents) {
    const user = await prisma.user.findUnique({
      where: { agentId: a.agentId },
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    })
    if (!user) continue
    const perms = new Set(
      user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`)),
    )
    const allowedTools = [...ALWAYS, ...Object.entries(TOOL_PERMS).filter(([, p]) => has(perms, p)).map(([t]) => t)]

    registry.agents[a.agentId] = {
      email: user.email,
      role: user.userRoles.map((ur) => ur.role.name).join(', '),
      department: a.department,
      permissionCount: perms.size,
      allowedTools,
    }
    const key = keyByAgent.get(a.agentId)
    if (key) secrets[a.agentId] = key
    else missingKey++
  }

  const regPath = join(AGENCY_ROOT, 'paperclip/config/crm-integration.json')
  const secPath = join(AGENCY_ROOT, 'data/crm-agent-keys.json')
  mkdirSync(dirname(regPath), { recursive: true })
  mkdirSync(dirname(secPath), { recursive: true })
  writeFileSync(regPath, JSON.stringify(registry, null, 2))
  writeFileSync(secPath, JSON.stringify(secrets, null, 2))

  console.log(`✅ wired ${Object.keys(registry.agents).length} agents`)
  console.log(`   registry -> ${regPath}`)
  console.log(`   secrets  -> ${secPath} (in gitignored data/)`)
  if (missingKey) console.log(`   ⚠ ${missingKey} agents had no key (run prisma/seed-agents.ts first)`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
