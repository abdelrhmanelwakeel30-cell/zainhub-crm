import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSession } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { QuotationPDF } from '@/lib/pdf/quotation-template'
import React from 'react'

// @react-pdf/renderer types are not fully compatible with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPdf = renderToBuffer as (element: any) => Promise<Buffer>

type Props = { params: Promise<{ type: string; id: string }> }

export async function GET(req: NextRequest, { params }: Props) {
  const session = await getSession()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { type, id } = await params
  const tenantId = session.user.tenantId

  // Fetch tenant info for PDF header
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, email: true, phone: true, address: true },
  })

  if (!tenant) {
    return new Response('Tenant not found', { status: 404 })
  }

  let pdfBuffer: Buffer
  let filename: string

  switch (type) {
    case 'invoice': {
      const invoice = await prisma.invoice.findFirst({
        where: { id, tenantId },
        include: {
          client: { select: { displayName: true, email: true, phone: true } },
          items: { orderBy: { order: 'asc' } },
        },
      })
      if (!invoice) return new Response('Invoice not found', { status: 404 })

      pdfBuffer = await renderPdf(
        React.createElement(InvoicePDF, {
          data: {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate?.toLocaleDateString('en-GB') ?? '',
            dueDate: invoice.dueDate.toLocaleDateString('en-GB'),
            status: invoice.status,
            companyName: tenant.name,
            companyEmail: tenant.email ?? undefined,
            companyPhone: tenant.phone ?? undefined,
            companyAddress: tenant.address ?? undefined,
            clientName: invoice.client.displayName,
            clientEmail: invoice.client.email ?? undefined,
            clientPhone: invoice.client.phone ?? undefined,
            items: invoice.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            })),
            subtotal: Number(invoice.subtotal),
            taxAmount: Number(invoice.taxAmount),
            discountAmount: Number(invoice.discountAmount),
            totalAmount: Number(invoice.totalAmount),
            amountPaid: Number(invoice.amountPaid),
            balanceDue: Number(invoice.balanceDue),
            currency: invoice.currency,
            notes: invoice.notes ?? undefined,
            terms: invoice.terms ?? undefined,
          },
        })
      )
      filename = `${invoice.invoiceNumber}.pdf`
      break
    }

    case 'quotation': {
      const quotation = await prisma.quotation.findFirst({
        where: { id, tenantId },
        include: {
          company: { select: { displayName: true, email: true } },
          contact: { select: { firstName: true, lastName: true, email: true } },
          items: { orderBy: { order: 'asc' } },
        },
      })
      if (!quotation) return new Response('Quotation not found', { status: 404 })

      pdfBuffer = await renderPdf(
        React.createElement(QuotationPDF, {
          data: {
            documentType: 'Quotation',
            documentNumber: quotation.quotationNumber,
            title: quotation.title,
            issueDate: quotation.issueDate?.toLocaleDateString('en-GB') ?? '',
            validUntil: quotation.validUntil?.toLocaleDateString('en-GB') ?? undefined,
            status: quotation.status,
            companyName: tenant.name,
            companyEmail: tenant.email ?? undefined,
            companyPhone: tenant.phone ?? undefined,
            companyAddress: tenant.address ?? undefined,
            clientName: quotation.company?.displayName ?? 'N/A',
            clientContact: quotation.contact ? `${quotation.contact.firstName} ${quotation.contact.lastName}` : undefined,
            clientEmail: quotation.contact?.email ?? quotation.company?.email ?? undefined,
            items: quotation.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            })),
            subtotal: Number(quotation.subtotal),
            taxAmount: Number(quotation.taxAmount),
            discountAmount: Number(quotation.discountAmount),
            totalAmount: Number(quotation.totalAmount),
            currency: quotation.currency,
            terms: quotation.terms ?? undefined,
            assumptions: quotation.assumptions ?? undefined,
            exclusions: quotation.exclusions ?? undefined,
          },
        })
      )
      filename = `${quotation.quotationNumber}.pdf`
      break
    }

    case 'proposal': {
      const proposal = await prisma.proposal.findFirst({
        where: { id, tenantId },
        include: {
          company: { select: { displayName: true, email: true } },
          contact: { select: { firstName: true, lastName: true, email: true } },
          items: { orderBy: { order: 'asc' } },
        },
      })
      if (!proposal) return new Response('Proposal not found', { status: 404 })

      pdfBuffer = await renderPdf(
        React.createElement(QuotationPDF, {
          data: {
            documentType: 'Proposal',
            documentNumber: proposal.proposalNumber,
            title: proposal.title,
            issueDate: proposal.issueDate?.toLocaleDateString('en-GB') ?? '',
            validUntil: proposal.validUntil?.toLocaleDateString('en-GB') ?? undefined,
            status: proposal.status,
            companyName: tenant.name,
            companyEmail: tenant.email ?? undefined,
            companyPhone: tenant.phone ?? undefined,
            companyAddress: tenant.address ?? undefined,
            clientName: proposal.company?.displayName ?? 'N/A',
            clientContact: proposal.contact ? `${proposal.contact.firstName} ${proposal.contact.lastName}` : undefined,
            clientEmail: proposal.contact?.email ?? proposal.company?.email ?? undefined,
            executiveSummary: proposal.executiveSummary ?? undefined,
            scopeOfWork: proposal.scopeOfWork ?? undefined,
            deliverables: proposal.deliverables ?? undefined,
            timeline: proposal.timeline ?? undefined,
            items: proposal.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            })),
            subtotal: Number(proposal.subtotal),
            taxAmount: Number(proposal.taxAmount),
            discountAmount: Number(proposal.discountAmount),
            totalAmount: Number(proposal.totalAmount),
            currency: proposal.currency,
            terms: proposal.terms ?? undefined,
            assumptions: proposal.assumptions ?? undefined,
            exclusions: proposal.exclusions ?? undefined,
          },
        })
      )
      filename = `${proposal.proposalNumber}.pdf`
      break
    }

    case 'contract': {
      const contract = await prisma.contract.findFirst({
        where: { id, tenantId },
        include: {
          client: { select: { displayName: true, email: true } },
          contact: { select: { firstName: true, lastName: true } },
        },
      })
      if (!contract) return new Response('Contract not found', { status: 404 })

      pdfBuffer = await renderPdf(
        React.createElement(QuotationPDF, {
          data: {
            documentType: 'Quotation', // reuse template for contract
            documentNumber: contract.contractNumber,
            title: contract.title,
            issueDate: contract.startDate.toLocaleDateString('en-GB'),
            validUntil: contract.endDate?.toLocaleDateString('en-GB') ?? undefined,
            status: contract.status,
            companyName: tenant.name,
            companyEmail: tenant.email ?? undefined,
            companyPhone: tenant.phone ?? undefined,
            companyAddress: tenant.address ?? undefined,
            clientName: contract.client.displayName,
            clientContact: contract.contact ? `${contract.contact.firstName} ${contract.contact.lastName}` : undefined,
            scopeOfWork: contract.scopeSummary ?? undefined,
            items: contract.value ? [{
              description: contract.title,
              quantity: 1,
              unitPrice: Number(contract.value),
              totalPrice: Number(contract.value),
            }] : [],
            subtotal: Number(contract.value ?? 0),
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: Number(contract.value ?? 0),
            currency: contract.currency,
            terms: contract.terms ?? undefined,
          },
        })
      )
      filename = `${contract.contractNumber}.pdf`
      break
    }

    default:
      return new Response(`Unknown document type: ${type}`, { status: 400 })
  }

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
