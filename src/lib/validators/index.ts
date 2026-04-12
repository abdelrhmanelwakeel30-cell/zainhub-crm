/**
 * Centralized Zod validation schemas for API request bodies.
 *
 * These schemas are the single source of truth for what clients can write
 * on each resource. They exist to prevent mass-assignment vulnerabilities
 * where an attacker could pass e.g. `tenantId`, `ownerId`, `createdAt`
 * or `archivedAt` to escalate privileges or corrupt data.
 *
 * All update schemas use `.partial()` and all fields are optional so a
 * PATCH can touch just the fields the UI cares about.
 */
import { z } from 'zod'

// ---- shared primitives ----------------------------------------------------
const cuid = z.string().min(1)
const optionalString = z.string().trim().max(5000).optional().nullable()
const shortString = z.string().trim().max(255)
const email = z.string().trim().email().max(320)
const phone = z.string().trim().max(40)
const url = z.string().trim().url().max(2048)
const money = z.number().finite().nonnegative()
const isoDate = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v : new Date(v)))
  .refine((d) => !isNaN(d.getTime()), 'Invalid date')

// ---- Contact --------------------------------------------------------------
export const ContactCreateSchema = z.object({
  firstName: shortString.min(1),
  lastName: shortString.min(1),
  email: email.optional().nullable(),
  phone: phone.optional().nullable(),
  whatsapp: phone.optional().nullable(),
  jobTitle: shortString.optional().nullable(),
  department: shortString.optional().nullable(),
  decisionRole: z
    .enum([
      'DECISION_MAKER',
      'INFLUENCER',
      'CHAMPION',
      'GATEKEEPER',
      'USER',
      'OTHER',
    ])
    .optional(),
  preferredLanguage: shortString.optional().nullable(),
  avatar: url.optional().nullable(),
  linkedinUrl: url.optional().nullable(),
  leadScore: z.number().int().min(0).max(100).optional(),
  source: shortString.optional().nullable(),
  notes: optionalString,
  companyId: cuid.optional().nullable(),
  companyRole: shortString.optional().nullable(),
})
export const ContactUpdateSchema = ContactCreateSchema.partial()
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>

// ---- Opportunity ----------------------------------------------------------
export const OpportunityCreateSchema = z.object({
  title: shortString.min(1),
  description: optionalString,
  companyId: cuid.optional().nullable(),
  primaryContactId: cuid.optional().nullable(),
  ownerId: cuid.optional(),
  pipelineId: cuid.optional().nullable(),
  stageId: cuid.optional().nullable(),
  expectedValue: money.optional(),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR', 'EGP']).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: isoDate.optional().nullable(),
  forecastMonth: shortString.optional().nullable(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  competitorNotes: optionalString,
  nextSteps: optionalString,
  wonAt: isoDate.optional().nullable(),
  lostAt: isoDate.optional().nullable(),
  lostReasonId: cuid.optional().nullable(),
  lostNotes: optionalString,
  wonReasonNotes: optionalString,
})
export const OpportunityUpdateSchema = OpportunityCreateSchema.partial()
export type OpportunityCreateInput = z.infer<typeof OpportunityCreateSchema>
export type OpportunityUpdateInput = z.infer<typeof OpportunityUpdateSchema>

// ---- Lead -----------------------------------------------------------------
export const LeadCreateSchema = z.object({
  firstName: shortString.min(1),
  lastName: shortString.min(1),
  email: email.optional().nullable(),
  phone: phone.optional().nullable(),
  whatsapp: phone.optional().nullable(),
  companyName: shortString.optional().nullable(),
  jobTitle: shortString.optional().nullable(),
  country: shortString.optional().nullable(),
  sourceId: cuid.optional().nullable(),
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST'])
    .optional(),
  interest: shortString.optional().nullable(),
  budget: money.optional().nullable(),
  timeframe: shortString.optional().nullable(),
  score: z.number().int().min(0).max(100).optional(),
  notes: optionalString,
  ownerId: cuid.optional().nullable(),
  preferredLanguage: shortString.optional().nullable(),
})
export const LeadUpdateSchema = LeadCreateSchema.partial()
export type LeadCreateInput = z.infer<typeof LeadCreateSchema>
export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>

// ---- Company --------------------------------------------------------------
export const CompanyCreateSchema = z.object({
  displayName: shortString.min(1),
  legalName: shortString.optional().nullable(),
  industry: shortString.optional().nullable(),
  subIndustry: shortString.optional().nullable(),
  size: shortString.optional().nullable(),
  annualRevenue: money.optional().nullable(),
  website: url.optional().nullable(),
  email: email.optional().nullable(),
  phone: phone.optional().nullable(),
  whatsapp: phone.optional().nullable(),
  country: shortString.optional().nullable(),
  city: shortString.optional().nullable(),
  addressLine: optionalString,
  logoUrl: url.optional().nullable(),
  linkedinUrl: url.optional().nullable(),
  twitterUrl: url.optional().nullable(),
  vatNumber: shortString.optional().nullable(),
  registrationNumber: shortString.optional().nullable(),
  preferredLanguage: shortString.optional().nullable(),
  tags: z.array(shortString).optional(),
  ownerId: cuid.optional().nullable(),
  notes: optionalString,
  status: shortString.optional().nullable(),
})
export const CompanyUpdateSchema = CompanyCreateSchema.partial()
export type CompanyCreateInput = z.infer<typeof CompanyCreateSchema>
export type CompanyUpdateInput = z.infer<typeof CompanyUpdateSchema>

// ---- Task -----------------------------------------------------------------
export const TaskCreateSchema = z.object({
  title: shortString.min(1),
  description: optionalString,
  assigneeId: cuid.optional().nullable(),
  dueDate: isoDate.optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z
    .enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'BLOCKED'])
    .optional(),
  entityType: shortString.optional().nullable(),
  entityId: cuid.optional().nullable(),
  projectId: cuid.optional().nullable(),
})
export const TaskUpdateSchema = TaskCreateSchema.partial()

// ---- Payment --------------------------------------------------------------
export const PaymentCreateSchema = z.object({
  invoiceId: cuid,
  clientId: cuid,
  amount: money.positive(),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR', 'EGP']).optional(),
  paymentDate: isoDate,
  paymentMethod: z
    .enum([
      'BANK_TRANSFER',
      'CREDIT_CARD',
      'CASH',
      'CHEQUE',
      'STRIPE',
      'PAYPAL',
      'OTHER',
    ])
    .optional(),
  reference: shortString.optional().nullable(),
  notes: optionalString,
})
export const PaymentUpdateSchema = PaymentCreateSchema.partial()

// ---- Project --------------------------------------------------------------
export const ProjectCreateSchema = z.object({
  name: shortString.min(1),
  description: optionalString,
  clientId: cuid.optional().nullable(),
  opportunityId: cuid.optional().nullable(),
  ownerId: cuid.optional().nullable(),
  status: z
    .enum([
      'NOT_STARTED',
      'IN_PROGRESS',
      'ON_HOLD',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: isoDate.optional().nullable(),
  endDate: isoDate.optional().nullable(),
  budget: money.optional().nullable(),
  currency: z.enum(['AED', 'USD', 'EUR', 'GBP', 'SAR', 'EGP']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  notes: optionalString,
})
export const ProjectUpdateSchema = ProjectCreateSchema.partial()

// ---- Ticket ---------------------------------------------------------------
export const TicketCreateSchema = z.object({
  subject: shortString.min(1),
  description: optionalString,
  clientId: cuid.optional().nullable(),
  contactId: cuid.optional().nullable(),
  assigneeId: cuid.optional().nullable(),
  status: z
    .enum(['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: shortString.optional().nullable(),
  channel: shortString.optional().nullable(),
})
export const TicketUpdateSchema = TicketCreateSchema.partial()

// ---- Generic helper -------------------------------------------------------
/**
 * Strip undefined values from a validated object before passing to Prisma.
 * Keeps `null` (which is how you clear an optional field) but removes
 * `undefined` so Prisma doesn't touch the column.
 */
export function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as T
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k]
  }
  return out
}
