/**
 * Heuristic lead scoring (AI-2). Pure function — no I/O — so it's easy to unit
 * test and reuse from the API route, the agent MCP, or batch jobs.
 *
 * Produces a 0–100 score from completeness + intent + recency signals.
 */

export interface ScorableLead {
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  companyName?: string | null
  budgetRange?: string | null
  urgency?: string | null
  nextFollowUpAt?: string | Date | null
  createdAt?: string | Date | null
  interestedServiceId?: string | null
}

const URGENCY_POINTS: Record<string, number> = { URGENT: 20, HIGH: 15, MEDIUM: 8, LOW: 3 }

export interface LeadScoreResult {
  score: number
  factors: { label: string; points: number }[]
}

export function computeLeadScore(lead: ScorableLead, now: number = Date.now()): LeadScoreResult {
  const factors: { label: string; points: number }[] = []
  const add = (label: string, points: number) => { if (points) factors.push({ label, points }) }

  if (lead.email) add('Has email', 15)
  if (lead.phone || lead.whatsapp) add('Has phone/WhatsApp', 15)
  if (lead.companyName) add('Company named', 10)
  if (lead.budgetRange) add('Budget provided', 20)
  if (lead.interestedServiceId) add('Service of interest', 7)

  const urgencyPts = URGENCY_POINTS[String(lead.urgency ?? '').toUpperCase()] ?? 0
  add(`Urgency: ${lead.urgency ?? 'none'}`, urgencyPts)

  if (lead.nextFollowUpAt) add('Follow-up scheduled', 10)

  if (lead.createdAt) {
    const ageDays = (now - new Date(lead.createdAt).getTime()) / 86_400_000
    if (ageDays <= 7) add('Created this week', 10)
    else if (ageDays <= 30) add('Created this month', 5)
  }

  const raw = factors.reduce((s, f) => s + f.points, 0)
  return { score: Math.max(0, Math.min(100, raw)), factors }
}
