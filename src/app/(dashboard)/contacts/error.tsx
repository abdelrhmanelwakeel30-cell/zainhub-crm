'use client'

import { SectionError } from '@/components/shared/section-error'

/**
 * Per-section error boundary. Closes R-004a from CRM-V3-PRODUCTION-AUDIT-2026-04-25.md.
 * Sentry capture happens in <SectionError> with boundary tag 'contacts'.
 */
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <SectionError {...props} boundary="contacts" />
}
