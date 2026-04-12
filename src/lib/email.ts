import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'CRM <noreply@zainhub.ae>'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send')
    return null
  }

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('[Email] Unexpected error:', err)
    return null
  }
}

// ─── Fire-and-forget helpers (don't await) ─────────────────────────────

export function sendInvoiceEmail(
  clientEmail: string,
  invoiceNumber: string,
  totalAmount: number,
  currency: string,
  dueDate: string,
  companyName: string,
  portalUrl?: string,
) {
  const viewLink = portalUrl
    ? `<p><a href="${portalUrl}" style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;text-decoration:none;border-radius:6px;">View Invoice</a></p>`
    : ''

  sendEmail({
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from ${companyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1E40AF;">Invoice ${invoiceNumber}</h2>
        <p>Dear Client,</p>
        <p>Please find your invoice details below:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Invoice Number</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${invoiceNumber}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${currency} ${totalAmount.toLocaleString()}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Due Date</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${dueDate}</td></tr>
        </table>
        ${viewLink}
        <p style="color:#666;font-size:12px;margin-top:32px;">This email was sent from ${companyName}'s CRM system.</p>
      </div>
    `,
  }).catch((err) => console.error('[Email] Invoice email failed:', err))
}

export function sendPaymentConfirmation(
  clientEmail: string,
  invoiceNumber: string,
  paymentAmount: number,
  currency: string,
  companyName: string,
) {
  sendEmail({
    to: clientEmail,
    subject: `Payment Received — ${invoiceNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#16a34a;">Payment Received</h2>
        <p>Dear Client,</p>
        <p>We have received your payment of <strong>${currency} ${paymentAmount.toLocaleString()}</strong> for invoice <strong>${invoiceNumber}</strong>.</p>
        <p>Thank you for your prompt payment.</p>
        <p style="color:#666;font-size:12px;margin-top:32px;">This email was sent from ${companyName}'s CRM system.</p>
      </div>
    `,
  }).catch((err) => console.error('[Email] Payment confirmation failed:', err))
}

export function sendQuotationEmail(
  clientEmail: string,
  quotationNumber: string,
  title: string,
  totalAmount: number,
  currency: string,
  companyName: string,
  portalUrl?: string,
) {
  const viewLink = portalUrl
    ? `<p><a href="${portalUrl}" style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;text-decoration:none;border-radius:6px;">View Quotation</a></p>`
    : ''

  sendEmail({
    to: clientEmail,
    subject: `Quotation ${quotationNumber}: ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1E40AF;">Quotation ${quotationNumber}</h2>
        <p>Dear Client,</p>
        <p>Please find below a quotation for <strong>${title}</strong>.</p>
        <p style="font-size:24px;font-weight:700;color:#1E40AF;">${currency} ${totalAmount.toLocaleString()}</p>
        ${viewLink}
        <p style="color:#666;font-size:12px;margin-top:32px;">This email was sent from ${companyName}'s CRM system.</p>
      </div>
    `,
  }).catch((err) => console.error('[Email] Quotation email failed:', err))
}

export function sendProposalEmail(
  clientEmail: string,
  proposalNumber: string,
  title: string,
  companyName: string,
  portalUrl?: string,
) {
  const viewLink = portalUrl
    ? `<p><a href="${portalUrl}" style="display:inline-block;padding:10px 24px;background:#1E40AF;color:#fff;text-decoration:none;border-radius:6px;">View Proposal</a></p>`
    : ''

  sendEmail({
    to: clientEmail,
    subject: `Proposal ${proposalNumber}: ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1E40AF;">Proposal ${proposalNumber}</h2>
        <p>Dear Client,</p>
        <p>We are pleased to present our proposal for <strong>${title}</strong>.</p>
        ${viewLink}
        <p style="color:#666;font-size:12px;margin-top:32px;">This email was sent from ${companyName}'s CRM system.</p>
      </div>
    `,
  }).catch((err) => console.error('[Email] Proposal email failed:', err))
}

export function sendTicketUpdateEmail(
  clientEmail: string,
  ticketSubject: string,
  status: string,
  companyName: string,
) {
  sendEmail({
    to: clientEmail,
    subject: `Ticket Update: ${ticketSubject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1E40AF;">Ticket Update</h2>
        <p>Dear Client,</p>
        <p>Your support ticket <strong>${ticketSubject}</strong> has been updated to status: <strong>${status}</strong>.</p>
        <p style="color:#666;font-size:12px;margin-top:32px;">This email was sent from ${companyName}'s CRM system.</p>
      </div>
    `,
  }).catch((err) => console.error('[Email] Ticket update email failed:', err))
}
