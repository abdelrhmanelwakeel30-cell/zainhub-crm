'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Subscribes to the realtime notifications SSE stream (C-9). On each server
 * push, invalidates the notifications queries so the badge + list update live.
 * EventSource auto-reconnects on drop, so no manual retry logic is needed.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return

    const es = new EventSource('/api/notifications/stream')
    const onPush = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    es.addEventListener('notifications', onPush)
    // Errors just mean the connection dropped; the browser reconnects automatically.
    es.onerror = () => {}

    return () => {
      es.removeEventListener('notifications', onPush)
      es.close()
    }
  }, [queryClient])
}
