import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { tenantId, id: userId } = session.user

  try {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId, archivedAt: null },
      include: { source: true, interestedService: true },
    })
    if (!lead) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    if (lead.convertedAt) return NextResponse.json({ success: false, error: 'Lead already converted' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      // Create Company
      let company = null
      if (lead.companyName) {
        const companyCount = await tx.company.count({ where: { tenantId } })
        company = await tx.company.create({
          data: {
            tenantId,
            companyNumber: `COM-${String(companyCount + 1).padStart(4, '0')}`,
            legalName: lead.companyName,
            displayName: lead.companyName,
            country: lead.country || null,
            city: lead.city || null,
            lifecycleStage: 'PROSPECT',
            accountOwnerId: lead.assignedToId || userId,
          },
        })
      }

      // Create Contact
      const nameParts = lead.fullName.trim().split(' ')
      const firstName = nameParts[0] || lead.fullName
      const lastName = nameParts.slice(1).join(' ') || ''
      const contactCount = await tx.contact.count({ where: { tenantId } })
      const contact = await tx.contact.create({
        data: {
          tenantId,
          contactNumber: `CON-${String(contactCount + 1).padStart(4, '0')}`,
          firstName,
          lastName,
          email: lead.email || null,
          phone: lead.phone || null,
          whatsapp: lead.whatsapp || null,
          ...(company && {
            companyContacts: { create: { companyId: company.id, isPrimary: true } },
          }),
        },
      })

      // Get default opportunity pipeline
      const defaultPipeline = await tx.pipeline.findFirst({
        where: { tenantId, entityType: 'OPPORTUNITY', isDefault: true },
        include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
      })

      // Create Opportunity
      const oppCount = await tx.opportunity.count({ where: { tenantId } })
      const opportunity = await tx.opportunity.create({
        data: {
          tenantId,
          opportunityNumber: `OPP-${String(oppCount + 1).padStart(4, '0')}`,
          title: lead.interestedService?.name || `Opportunity from ${lead.fullName}`,
          companyId: company?.id || null,
          primaryContactId: contact.id,
          ownerId: lead.assignedToId || userId,
          pipelineId: defaultPipeline?.id || null,
          stageId: defaultPipeline?.stages[0]?.id || null,
          expectedValue: 0,
          currency: 'AED',
          probability: 20,
          weightedValue: 0,
          createdById: userId,
        },
      })

      // Mark lead as converted
      await tx.lead.update({
        where: { id },
        data: {
          convertedAt: new Date(),
          convertedCompanyId: company?.id || null,
          convertedContactId: contact.id,
          convertedOpportunityId: opportunity.id,
        },
      })

      // R-009 (CRM-V3-FULL-AUDIT-2026-04-25.md): write the audit log INSIDE the
      // transaction. If audit insert fails, the conversion rolls back —
      // no orphaned converted leads without an audit entry.
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CONVERT', entityType: 'lead', entityId: id, entityName: lead.fullName },
      })

      return { company, contact, opportunity }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (err) {
    console.error('POST /api/leads/[id]/convert', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
