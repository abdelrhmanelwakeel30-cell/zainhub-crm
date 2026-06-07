import { NextRequest } from 'next/server'
import { getApiSession } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

/**
 * Realtime notifications via Server-Sent Events (C-9).
 *
 * Holds one long-lived connection per browser tab and pushes the user's unread
 * count whenever it changes (server-side poll, so the client doesn't poll). The
 * client invalidates its notifications query on each push. Bounded to ~4 min so
 * serverless function limits aren't hit; EventSource auto-reconnects after.
 *
 * Node runtime (Prisma). Browser EventSource carries the session cookie, so the
 * middleware gate + getApiSession both pass; agents (header keys) don't use this.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const POLL_MS = 15_000
const HEARTBEAT_MS = 25_000
const MAX_DURATION_MS = 240_000

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { tenantId, id: userId } = session.user
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let lastCount = -1

      const enc = (s: string) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(s))
          } catch {
            /* controller already closed */
          }
        }
      }
      const send = (event: string, data: unknown) => enc(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

      const poll = async () => {
        try {
          const unread = await prisma.notification.count({ where: { tenantId, userId, isRead: false } })
          if (unread !== lastCount) {
            lastCount = unread
            send('notifications', { unread })
          }
        } catch {
          /* transient DB error — keep the stream alive */
        }
      }

      const cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(pollTimer)
        clearInterval(heartbeatTimer)
        clearTimeout(maxTimer)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }

      send('ready', { ok: true })
      void poll()
      const pollTimer = setInterval(() => void poll(), POLL_MS)
      const heartbeatTimer = setInterval(() => enc(': ping\n\n'), HEARTBEAT_MS)
      const maxTimer = setTimeout(cleanup, MAX_DURATION_MS)
      req.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
