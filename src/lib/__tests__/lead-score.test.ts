import { describe, it, expect } from 'vitest'
import { computeLeadScore } from '@/lib/lead-score'

const NOW = new Date('2026-06-01T00:00:00Z').getTime()

describe('computeLeadScore', () => {
  it('scores an empty lead at 0', () => {
    expect(computeLeadScore({}, NOW).score).toBe(0)
  })

  it('sums completeness + intent + recency and clamps to 100', () => {
    const r = computeLeadScore(
      { email: 'a@b.co', phone: '+971', companyName: 'Acme', budgetRange: '50k', urgency: 'URGENT', nextFollowUpAt: '2026-06-10', interestedServiceId: 's1', createdAt: '2026-05-30' },
      NOW,
    )
    // 15+15+10+20+7+20+10+10 = 107 -> clamped to 100
    expect(r.score).toBe(100)
    expect(r.factors.length).toBeGreaterThan(5)
  })

  it('weights urgency tiers correctly', () => {
    const high = computeLeadScore({ urgency: 'HIGH' }, NOW).score
    const low = computeLeadScore({ urgency: 'LOW' }, NOW).score
    expect(high).toBeGreaterThan(low)
    expect(low).toBe(3)
  })

  it('rewards recency (this week > this month > old)', () => {
    const week = computeLeadScore({ createdAt: '2026-05-28' }, NOW).score
    const month = computeLeadScore({ createdAt: '2026-05-10' }, NOW).score
    const old = computeLeadScore({ createdAt: '2026-01-01' }, NOW).score
    expect(week).toBe(10)
    expect(month).toBe(5)
    expect(old).toBe(0)
  })

  it('never exceeds 100 or drops below 0', () => {
    const r = computeLeadScore({ email: 'x', phone: 'y', companyName: 'z', budgetRange: 'b', urgency: 'URGENT', nextFollowUpAt: 'd', interestedServiceId: 'i', createdAt: '2026-05-31' }, NOW)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBeGreaterThanOrEqual(0)
  })
})
