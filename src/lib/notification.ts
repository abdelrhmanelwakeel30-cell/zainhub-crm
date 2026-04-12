import { prisma as _prisma } from '@/lib/prisma'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = _prisma as any

interface CreateNotificationParams {
  tenantId: string
  userId: string
  type: string
  title: string
  body?: string | null
  entityType?: string | null
  entityId?: string | null
  actionUrl?: string | null
}

/**
 * Fire-and-forget notification creator. Writes to the Notification
 * table without blocking the caller.
 */
export function createNotification(params: CreateNotificationParams): void {
  prisma.notification
    .create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        actionUrl: params.actionUrl ?? null,
      },
    })
    .catch((err: Error) => {
      console.error('[Notification] Failed to create notification:', err.message)
    })
}

/**
 * Notify multiple users at once (e.g., all project members).
 */
export function notifyUsers(userIds: string[], params: Omit<CreateNotificationParams, 'userId'>): void {
  for (const userId of userIds) {
    createNotification({ ...params, userId })
  }
}

/**
 * Convenience: notify on task assignment
 */
export function notifyTaskAssigned(tenantId: string, assigneeId: string, taskTitle: string, taskId: string) {
  createNotification({
    tenantId,
    userId: assigneeId,
    type: 'task_assigned',
    title: `New task assigned: ${taskTitle}`,
    entityType: 'task',
    entityId: taskId,
    actionUrl: '/tasks',
  })
}

/**
 * Convenience: notify on ticket assignment
 */
export function notifyTicketAssigned(tenantId: string, assigneeId: string, ticketSubject: string, ticketId: string) {
  createNotification({
    tenantId,
    userId: assigneeId,
    type: 'ticket_assigned',
    title: `Ticket assigned: ${ticketSubject}`,
    entityType: 'ticket',
    entityId: ticketId,
    actionUrl: '/tickets',
  })
}

/**
 * Convenience: notify on lead assignment
 */
export function notifyLeadAssigned(tenantId: string, assigneeId: string, leadName: string, leadId: string) {
  createNotification({
    tenantId,
    userId: assigneeId,
    type: 'lead_assigned',
    title: `New lead assigned: ${leadName}`,
    entityType: 'lead',
    entityId: leadId,
    actionUrl: '/leads',
  })
}

/**
 * Convenience: notify owner on invoice overdue
 */
export function notifyInvoiceOverdue(tenantId: string, userId: string, invoiceNumber: string, invoiceId: string) {
  createNotification({
    tenantId,
    userId,
    type: 'invoice_overdue',
    title: `Invoice ${invoiceNumber} is overdue`,
    entityType: 'invoice',
    entityId: invoiceId,
    actionUrl: '/invoices',
  })
}
