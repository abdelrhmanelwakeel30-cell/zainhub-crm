#!/usr/bin/env node
/**
 * ZainHub CRM MCP server.
 *
 * Bridges the paperclip 166-agent platform to the CRM. Each agent runs this
 * server with its OWN API key (env CRM_AGENT_KEY). Every tool call hits the
 * existing CRM REST API with that key — so multi-tenant scoping, RBAC and
 * audit attribution are enforced server-side by the CRM, not here. This server
 * is a thin, ergonomic tool surface; it grants no authority of its own.
 *
 * Env:
 *   CRM_BASE_URL   default http://localhost:3000
 *   CRM_AGENT_KEY  required — the agent's zhk_... key (from prisma/seed-agents.ts)
 *
 * Run:  CRM_AGENT_KEY=zhk_... node mcp-server/index.mjs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL = (process.env.CRM_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const AGENT_KEY = process.env.CRM_AGENT_KEY

if (!AGENT_KEY) {
  console.error('[crm-mcp] CRM_AGENT_KEY is required (the agent zhk_... key).')
  process.exit(1)
}

/** Call the CRM REST API with the agent's key. Returns parsed JSON. */
async function api(method, path, { query, body } = {}) {
  const url = new URL(BASE_URL + (path.startsWith('/') ? path : `/${path}`))
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${AGENT_KEY}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const err = json?.error ?? json?.raw ?? res.statusText
    throw new Error(`CRM ${method} ${path} -> ${res.status}: ${typeof err === 'string' ? err : JSON.stringify(err)}`)
  }
  return json
}

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: `Error: ${e.message || String(e)}` }] })

const server = new McpServer({ name: 'zainhub-crm', version: '0.1.0' })

// ── Identity / connectivity ────────────────────────────────────────────────
server.tool(
  'crm_whoami',
  'Return this agent\'s CRM identity: tenant, roles and the exact permissions it is allowed to use.',
  {},
  async () => {
    try { return ok(await api('GET', '/api/agent/me')) } catch (e) { return fail(e) }
  },
)

// ── Generic, RBAC-enforced passthrough (covers any CRM endpoint) ─────────────
server.tool(
  'crm_request',
  'Generic CRM API call (RBAC enforced server-side). Use for any endpoint not covered by a named tool. path must start with /api/.',
  {
    method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']),
    path: z.string().describe('e.g. /api/invoices or /api/leads/<id>'),
    query: z.record(z.string()).optional(),
    body: z.record(z.any()).optional(),
  },
  async ({ method, path, query, body }) => {
    if (!path.startsWith('/api/')) return fail(new Error('path must start with /api/'))
    try { return ok(await api(method, path, { query, body })) } catch (e) { return fail(e) }
  },
)

// ── Leads ────────────────────────────────────────────────────────────────
server.tool(
  'crm_list_leads',
  'List/search leads (paginated).',
  {
    search: z.string().optional(),
    stageId: z.string().optional(),
    assignedToId: z.string().optional(),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    page: z.number().int().optional(),
    pageSize: z.number().int().max(100).optional(),
  },
  async (q) => { try { return ok(await api('GET', '/api/leads', { query: q })) } catch (e) { return fail(e) } },
)
server.tool(
  'crm_create_lead',
  'Create a new lead. Requires leads:create permission.',
  {
    fullName: z.string().min(2),
    email: z.string().optional(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    companyName: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    notesSummary: z.string().optional(),
  },
  async (body) => { try { return ok(await api('POST', '/api/leads', { body })) } catch (e) { return fail(e) } },
)

// ── Companies / Contacts ──────────────────────────────────────────────────
server.tool('crm_list_companies', 'List/search companies (paginated).',
  { search: z.string().optional(), page: z.number().int().optional(), pageSize: z.number().int().max(100).optional() },
  async (q) => { try { return ok(await api('GET', '/api/companies', { query: q })) } catch (e) { return fail(e) } })
server.tool('crm_create_company', 'Create a company. Requires companies:create. Pass the company fields as an object.',
  { fields: z.record(z.any()) },
  async ({ fields }) => { try { return ok(await api('POST', '/api/companies', { body: fields })) } catch (e) { return fail(e) } })
server.tool('crm_list_contacts', 'List/search contacts (paginated).',
  { search: z.string().optional(), page: z.number().int().optional(), pageSize: z.number().int().max(100).optional() },
  async (q) => { try { return ok(await api('GET', '/api/contacts', { query: q })) } catch (e) { return fail(e) } })
server.tool('crm_create_contact', 'Create a contact. Requires contacts:create. Pass the contact fields as an object.',
  { fields: z.record(z.any()) },
  async ({ fields }) => { try { return ok(await api('POST', '/api/contacts', { body: fields })) } catch (e) { return fail(e) } })

// ── Tasks / Tickets / Opportunities ───────────────────────────────────────
server.tool('crm_create_task', 'Create a task. Requires tasks:create. Pass the task fields as an object.',
  { fields: z.record(z.any()) },
  async ({ fields }) => { try { return ok(await api('POST', '/api/tasks', { body: fields })) } catch (e) { return fail(e) } })
server.tool('crm_list_tickets', 'List/search support tickets (paginated).',
  { search: z.string().optional(), page: z.number().int().optional(), pageSize: z.number().int().max(100).optional() },
  async (q) => { try { return ok(await api('GET', '/api/tickets', { query: q })) } catch (e) { return fail(e) } })
server.tool('crm_create_ticket', 'Create a support ticket. Requires tickets:create. Pass the ticket fields as an object.',
  { fields: z.record(z.any()) },
  async ({ fields }) => { try { return ok(await api('POST', '/api/tickets', { body: fields })) } catch (e) { return fail(e) } })
server.tool('crm_list_opportunities', 'List/search opportunities (paginated).',
  { search: z.string().optional(), page: z.number().int().optional(), pageSize: z.number().int().max(100).optional() },
  async (q) => { try { return ok(await api('GET', '/api/opportunities', { query: q })) } catch (e) { return fail(e) } })

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`[crm-mcp] ready — base=${BASE_URL}, key=${AGENT_KEY.slice(0, 12)}…`)
